import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Plus, Smile, ThumbsUp } from 'lucide-react';
import './CommunityBoard.css';

const CommunityBoard = () => {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'ผู้ใช้ A',
      avatar: '😊',
      content: 'วันนี้ลองทำกิจกรรมที่ AI แนะนำแล้วรู้สึกดีมาก! การเดินเล่นในสวนช่วยให้ใจสงบขึ้นเยอะเลย',
      timestamp: '2 ชั่วโมงที่แล้ว',
      likes: 12,
      comments: 3,
      emotion: 'Happy',
      activity: 'เดินเล่นในสวนสาธารณะ'
    },
    {
      id: 2,
      author: 'ผู้ใช้ B',
      avatar: '🎨',
      content: 'เพิ่งเสร็จจากการวาดรูปตามที่แนะนำ รู้สึกภูมิใจในตัวเองมาก! ศิลปะช่วยเยียวยาจิตใจได้จริงๆ',
      timestamp: '4 ชั่วโมงที่แล้ว',
      likes: 8,
      comments: 1,
      emotion: 'Neutral',
      activity: 'วาดรูปหรือระบายสี'
    },
    {
      id: 3,
      author: 'ผู้ใช้ C',
      avatar: '🧘‍♀️',
      content: 'เมื่อวานรู้สึกเครียดมาก แต่การฝึกหายใจลึกๆ ช่วยได้เยอะเลย ขอบคุณ AI ที่แนะนำกิจกรรมนี้',
      timestamp: '1 วันที่แล้ว',
      likes: 15,
      comments: 5,
      emotion: 'Angry',
      activity: 'ฝึกหายใจลึกๆ'
    },
    {
      id: 4,
      author: 'ผู้ใช้ D',
      avatar: '📚',
      content: 'อ่านหนังสือที่ชอบแล้วรู้สึกผ่อนคลายมาก การใช้เวลากับตัวเองแบบนี้มีค่ามาก',
      timestamp: '2 วันที่แล้ว',
      likes: 6,
      comments: 2,
      emotion: 'Neutral',
      activity: 'อ่านหนังสือที่สนใจ'
    },
    {
      id: 5,
      author: 'ผู้ใช้ E',
      avatar: '🏃‍♂️',
      content: 'ออกกำลังกายหนักๆ หลังจากรู้สึกโกรธ ช่วยให้รู้สึกดีขึ้นมาก! พลังงานลบกลายเป็นพลังบวก',
      timestamp: '3 วันที่แล้ว',
      likes: 20,
      comments: 7,
      emotion: 'Angry',
      activity: 'วิ่งหรือออกกำลังกายหนัก'
    }
  ]);

  const [likedPosts, setLikedPosts] = useState(new Set());

  const handleLike = (postId) => {
    setLikedPosts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId ? { ...post, likes: post.likes - 1 } : post
          )
        );
      } else {
        newLiked.add(postId);
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }
      return newLiked;
    });
  };

  const handleSubmitPost = (e) => {
    e.preventDefault();
    if (newPost.trim()) {
      const post = {
        id: posts.length + 1,
        author: 'คุณ',
        avatar: '👤',
        content: newPost,
        timestamp: 'เมื่อสักครู่',
        likes: 0,
        comments: 0,
        emotion: 'Neutral',
        activity: 'แชร์ความรู้สึก'
      };
      setPosts(prev => [post, ...prev]);
      setNewPost('');
    }
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      Happy: '#10B981',
      Sad: '#3B82F6',
      Angry: '#EF4444',
      Surprised: '#F59E0B',
      Fearful: '#8B5CF6',
      Disgusted: '#6B7280',
      Neutral: '#6B7280'
    };
    return colors[emotion] || '#6B7280';
  };

  return (
    <div className="community-board">
      <div className="board-header">
        <h2>ชุมชนส่งกำลังใจ</h2>
        <p>แบ่งปันประสบการณ์และให้กำลังใจซึ่งกันและกัน</p>
      </div>

      <div className="create-post">
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
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="author-info">
                <span className="author-avatar">{post.avatar}</span>
                <div className="author-details">
                  <span className="author-name">{post.author}</span>
                  <span className="post-timestamp">{post.timestamp}</span>
                </div>
              </div>
              <div className="post-meta">
                <span 
                  className="emotion-tag"
                  style={{ backgroundColor: getEmotionColor(post.emotion) }}
                >
                  {post.emotion}
                </span>
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
                className={`action-btn like-btn ${likedPosts.has(post.id) ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
              >
                <ThumbsUp className="action-icon" />
                <span>{post.likes}</span>
              </button>
              
              <button className="action-btn comment-btn">
                <MessageCircle className="action-icon" />
                <span>{post.comments}</span>
              </button>
              
              <button className="action-btn share-btn">
                <Share2 className="action-icon" />
                <span>แชร์</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="community-stats">
        <div className="stat-item">
          <Heart className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">{posts.reduce((sum, post) => sum + post.likes, 0)}</span>
            <span className="stat-label">กำลังใจทั้งหมด</span>
          </div>
        </div>
        
        <div className="stat-item">
          <MessageCircle className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">{posts.reduce((sum, post) => sum + post.comments, 0)}</span>
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
