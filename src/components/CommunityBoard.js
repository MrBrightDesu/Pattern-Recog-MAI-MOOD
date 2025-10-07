import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MessageCircle, Plus, Smile, ThumbsUp, Trash2, Filter } from 'lucide-react';
import './CommunityBoard.css';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove, where, deleteDoc, writeBatch } from 'firebase/firestore';

const CommunityBoard = () => {
  const { currentUser } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [showOnlyMyPosts, setShowOnlyMyPosts] = useState(false);
  const [latestEmotionData, setLatestEmotionData] = useState(null);

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          author: data.author || 'ไม่ระบุ',
          avatar: data.avatar || '👤',
          content: data.content || '',
          timestamp: data.timestamp || null,
          emotion: data.emotion || 'Neutral',
          activity: data.activity || '',
          likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
          commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : 0,
          userId: data.userId || null
        };
      });
      setPosts(items);
    });
    return () => unsubscribe();
  }, []);

  // Load comments for posts
  useEffect(() => {
    const unsubscribes = [];
    posts.forEach(post => {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      const q = query(commentsRef, orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(prev => ({
          ...prev,
          [post.id]: commentsData
        }));
      });
      unsubscribes.push(unsubscribe);
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [posts]);

  // ดึงข้อมูลอารมณ์และกิจกรรมล่าสุดของผู้ใช้
  useEffect(() => {
    if (!currentUser) return;
    
    const emotionAnalysisRef = collection(db, 'emotionAnalysis');
    const q = query(
      emotionAnalysisRef, 
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestDoc = snapshot.docs[0];
        const data = latestDoc.data();
        setLatestEmotionData({
          emotion: data.emotion,
          recommendedActivities: data.recommendedActivities || [],
          timestamp: data.timestamp
        });
      }
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  const likedPostIds = useMemo(() => {
    if (!currentUser) return new Set();
    const setIds = new Set();
    posts.forEach((p) => {
      if (Array.isArray(p.likedBy) && p.likedBy.includes(currentUser.uid)) {
        setIds.add(p.id);
      }
    });
    return setIds;
  }, [posts, currentUser]);

  const handleLike = async (postId) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนกดถูกใจ');
      return;
    }
    
    // Find the post to check if it's the user's own post
    const post = posts.find(p => p.id === postId);
    if (post && post.userId === currentUser.uid) {
      alert('ไม่สามารถกดถูกใจโพสต์ของตัวเองได้');
      return;
    }
    
    const postRef = doc(db, 'posts', postId);
    const alreadyLiked = likedPostIds.has(postId);
    await updateDoc(postRef, {
      likedBy: alreadyLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    });
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนลบโพสต์');
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (!post || post.userId !== currentUser.uid) {
      alert('คุณสามารถลบได้เฉพาะโพสต์ของตัวเองเท่านั้น');
      return;
    }
    
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้? การลบจะไม่สามารถย้อนกลับได้')) {
      return;
    }
    
    try {
      const batch = writeBatch(db);
      
      // ลบโพสต์หลัก
      const postRef = doc(db, 'posts', postId);
      batch.delete(postRef);
      
      // ลบคอมเมนต์ทั้งหมดในโพสต์นี้
      const commentsSnapshot = await onSnapshot(collection(db, 'posts', postId, 'comments'), (snapshot) => {
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      });
      
      await batch.commit();
      alert('ลบโพสต์สำเร็จ');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('เกิดข้อผิดพลาดในการลบโพสต์');
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    const profileName = currentUser?.displayName || 'คุณ';
    
    // ใช้ข้อมูลอารมณ์และกิจกรรมล่าสุด หรือใช้ค่าเริ่มต้น
    const emotion = latestEmotionData?.emotion || 'Neutral';
    const activity = latestEmotionData?.recommendedActivities?.[0]?.title || 'แชร์ความรู้สึก';
    
    const post = {
      author: profileName,
      avatar: '👤',
      content: newPost.trim(),
      timestamp: serverTimestamp(),
      emotion: emotion,
      activity: activity,
      likedBy: [],
      commentsCount: 0,
      userId: currentUser ? currentUser.uid : null
    };
    await addDoc(collection(db, 'posts'), post);
    setNewPost('');
  };

  const handleAddComment = async (postId) => {
    if (!newComment[postId]?.trim()) return;
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนคอมเมนต์');
      return;
    }
    
    const comment = {
      author: currentUser.displayName || 'คุณ',
      avatar: '👤',
      content: newComment[postId].trim(),
      timestamp: serverTimestamp(),
      userId: currentUser.uid
    };
    
    await addDoc(collection(db, 'posts', postId, 'comments'), comment);
    setNewComment(prev => ({ ...prev, [postId]: '' }));
  };

  // Filter และ sort โพสต์
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;
    
    // Debug: แสดงข้อมูลอารมณ์ที่มีในโพสต์
    console.log('All posts emotions:', posts.map(p => ({ id: p.id, emotion: p.emotion, author: p.author, userId: p.userId })));
    
    // Filter ตามผู้ใช้ (แสดงแค่ของตัวเองหรือไม่)
    if (showOnlyMyPosts && currentUser) {
      filtered = filtered.filter(post => post.userId === currentUser.uid);
      console.log('Filtered by user:', filtered.map(p => ({ id: p.id, emotion: p.emotion, author: p.author })));
    }
    
    // Filter ตามอารมณ์
    if (filterEmotion !== 'all') {
      filtered = filtered.filter(post => {
        // รองรับทั้งรูปแบบใหม่และเก่า
        const postEmotion = post.emotion?.toLowerCase();
        const filterEmotionLower = filterEmotion.toLowerCase();
        
        return postEmotion === filterEmotionLower || 
               postEmotion === filterEmotion ||
               post.emotion === filterEmotion;
      });
      
      console.log(`Filtered by ${filterEmotion}:`, filtered.map(p => ({ id: p.id, emotion: p.emotion, author: p.author })));
    }
    
    // Sort ตามเวลาหรือจำนวน like
    if (sortBy === 'likes') {
      filtered = [...filtered].sort((a, b) => {
        const aLikes = Array.isArray(a.likedBy) ? a.likedBy.length : 0;
        const bLikes = Array.isArray(b.likedBy) ? b.likedBy.length : 0;
        return bLikes - aLikes;
      });
    } else {
      // Sort ตามเวลา (ใหม่สุดก่อน)
      filtered = [...filtered].sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
        return bTime - aTime;
      });
    }
    
    return filtered;
  }, [posts, filterEmotion, sortBy, showOnlyMyPosts, currentUser]);

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const getEmotionColor = (emotion) => {
    const e = String(emotion || '').toLowerCase();
    const isPositive = e === 'happy' || e === 'happiness' || e === 'surprised' || e === 'surprise';
    const isNegative = e === 'sad' || e === 'sadness' || e === 'angry' || e === 'anger' || e === 'fearful' || e === 'fear' || e === 'disgusted' || e === 'disgust';
    if (isPositive) return '#FBEE95';
    if (isNegative) return '#C0AFE2';
    return '#6B7280';
  };

  return (
    <div className="community-board">
      <div className="board-header">
        <h2>ชุมชนส่งกำลังใจ</h2>
        <p>แบ่งปันประสบการณ์และให้กำลังใจซึ่งกันและกัน</p>
      </div>

      {/* Filter และ Sort Controls */}
      <div className="filter-controls">
        <div className="filter-section">
          <label htmlFor="emotion-filter">
            <Filter className="filter-icon" />
            กรองตามอารมณ์:
          </label>
          <select 
            id="emotion-filter"
            value={filterEmotion} 
            onChange={(e) => setFilterEmotion(e.target.value)}
            className="filter-select"
          >
            <option value="all">ทั้งหมด</option>}
            <option value="Happy">😊 Happy</option>
            <option value="Sad">😢 Sad</option>
            <option value="Angry">😠 Angry</option>
            <option value="Surprised">😲 Surprised</option>
            <option value="Fearful">😨 Fearful</option>
            <option value="Disgusted">🤢 Disgusted</option>
            <option value="Neutral">😐 Neutral</option>
          </select>
        </div>
        
        <div className="sort-section">
          <label htmlFor="sort-select">เรียงตาม:</label>
          <select 
            id="sort-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="time">เวลา (ใหม่สุด)</option>
            <option value="likes">จำนวนถูกใจ</option>
          </select>
        </div>
        
        <div className="user-filter-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showOnlyMyPosts}
              onChange={(e) => setShowOnlyMyPosts(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">แสดงแค่โพสต์ของตัวเอง</span>
          </label>
        </div>
        
        {/* Debug Info */}
        <div className="debug-info">
          <small>
            โพสต์ทั้งหมด: {posts.length} | 
            แสดง: {filteredAndSortedPosts.length} | 
            {showOnlyMyPosts ? 'โพสต์ของตัวเอง' : 'โพสต์ทุกคน'} | 
            อารมณ์ที่มี: {[...new Set(posts.map(p => p.emotion))].join(', ')}
          </small>
        </div>
      </div>

      <div className="create-post">
        {/* แสดงข้อมูลอารมณ์และกิจกรรมล่าสุด */}
        {latestEmotionData && (
          <div className="latest-emotion-info">
            <h4>ข้อมูลล่าสุดจากการตรวจจับอารมณ์</h4>
            <div className="emotion-activity-display">
              <div className="emotion-info">
                <span className="emotion-label">อารมณ์:</span>
                <span 
                  className="emotion-value"
                  style={{ backgroundColor: getEmotionColor(latestEmotionData.emotion) }}
                >
                  {latestEmotionData.emotion}
                </span>
              </div>
              {latestEmotionData.recommendedActivities.length > 0 && (
                <div className="activity-info">
                  <span className="activity-label">กิจกรรมแนะนำ:</span>
                  <span className="activity-value">
                    {latestEmotionData.recommendedActivities[0].title}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmitPost} className="post-form">
          <div className="form-header">
            <span className="user-avatar">👤</span>
            <span className="user-name">คุณ</span>
          </div>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="แบ่งปันประสบการณ์ของคุณกับการใช้ MAI Mood Coach..."
            className="post-input"
            rows="3"
          />
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={!newPost.trim()}>
              <Plus className="btn-icon" />
              แชร์โพสต์
            </button>
          </div>
        </form>
      </div>

      <div className="posts-container">
        {filteredAndSortedPosts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="author-info">
                <span className="author-avatar">{post.avatar}</span>
                <div className="author-details">
                  <span className="author-name">{post.author}</span>
                  <span className="post-timestamp">{post.timestamp && post.timestamp.toDate ? post.timestamp.toDate().toLocaleString() : 'เมื่อสักครู่'}</span>
                </div>
              </div>
              <div className="post-meta">
                <span 
                  className="emotion-tag"
                  style={{ backgroundColor: getEmotionColor(post.emotion) }}
                >
                  {post.emotion}
                </span>
                {post.userId === currentUser?.uid && (
                  <button 
                    className="delete-post-btn"
                    onClick={() => handleDeletePost(post.id)}
                    title="ลบโพสต์"
                  >
                    <Trash2 className="delete-icon" />
                  </button>
                )}
              </div>
            </div>

            <div className="post-content">
              <p>{post.content}</p>
              {post.activity && (
                <div className="activity-tag">
                  <span className="activity-label">กิจกรรม:</span>
                  <span className="activity-name">{post.activity}</span>
                </div>
              )}
            </div>

            <div className="post-actions">
              <button 
                className={`action-btn like-btn ${likedPostIds.has(post.id) ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
                disabled={post.userId === currentUser?.uid}
              >
                <ThumbsUp className="action-icon" />
                <span>{Array.isArray(post.likedBy) ? post.likedBy.length : 0}</span>
              </button>
              
              <button 
                className="action-btn comment-btn"
                onClick={() => toggleComments(post.id)}
              >
                <MessageCircle className="action-icon" />
                <span>{comments[post.id]?.length || 0}</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div className="comments-section">
                <div className="comments-list">
                  {(comments[post.id] || []).map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <span className="comment-author-avatar">{comment.avatar}</span>
                        <div className="comment-author-info">
                          <span className="comment-author-name">{comment.author}</span>
                          <span className="comment-timestamp">
                            {comment.timestamp && comment.timestamp.toDate ? 
                              comment.timestamp.toDate().toLocaleString() : 'เมื่อสักครู่'}
                          </span>
                        </div>
                      </div>
                      <div className="comment-content">
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="add-comment">
                  <div className="comment-form">
                    <textarea
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="เขียนความคิดเห็น..."
                      className="comment-input"
                      rows="2"
                    />
                    <button 
                      className="comment-submit-btn"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                    >
                      <Plus className="btn-icon" />
                      ส่ง
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="community-stats">
        <div className="stat-item">
          <Heart className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">{posts.reduce((sum, post) => sum + (Array.isArray(post.likedBy) ? post.likedBy.length : 0), 0)}</span>
            <span className="stat-label">กำลังใจทั้งหมด</span>
          </div>
        </div>
        
        <div className="stat-item">
          <MessageCircle className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">
              {Object.values(comments).reduce((sum, postComments) => sum + (postComments?.length || 0), 0)}
            </span>
            <span className="stat-label">ความคิดเห็น</span>
          </div>
        </div>
        
        <div className="stat-item">
          <Smile className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">{posts.length}</span>
            <span className="stat-label">โพสต์ทั้งหมด</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityBoard;
