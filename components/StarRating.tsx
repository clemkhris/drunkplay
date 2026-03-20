"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';   // ← make sure this path is correct


interface StarRatingProps {
  gameId: number;
  initialRating?: number; // current average from DB
  userHasRated?: boolean; // optional, to disable after vote
  onRate?: (newAvg: number) => void; // callback to update UI
}

export default function StarRating({ gameId, initialRating = 0, userHasRated = false, onRate }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0); // temp for hover preview
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current logged-in user once when component mounts
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });

    // Optional: listen for login/logout changes (good for real-time feel)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    // Cleanup listener when component unmounts
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleClick = async (value: number) => {
    if (userHasRated) return alert("已经投过票啦～");

    console.log("当前用户:", currentUser);  // ← 加这行，看是不是 null

    if (!currentUser) {
      alert("先登录/注册才能评分哦～ 🍻");
      return;
    }

    console.log("准备插入: game_id =", gameId, "user_id =", currentUser.id, "rating =", value);

    const { data, error } = await supabase
      .from('game_ratings')
      .insert({ 
        game_id: gameId, 
        user_id: currentUser.id, 
        rating: value 
      })
      .select();  // ← 加 .select() 方便看返回

    if (error) {
      console.error("评分错误详情:", error);  // ← 超级重要！看这里
      alert(`评分失败: ${error.message || "未知错误... 再摇一次？"}`);
      return;
    }

    console.log("插入成功:", data);

// ... insert 成功后

// 计算新平均分（保持你原来的逻辑）
const { data: avgData } = await supabase
  .from('game_ratings')
  .select('rating')
  .eq('game_id', gameId);

const newAvg = avgData?.length
  ? avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length
  : value;

// 告诉父组件：分数变了！（父组件会负责更新 games state）
onRate?.(newAvg);

// 可选：本地先假装更新（视觉反馈快）
setRating(value);  // 让当前星星保持你点的状态
alert(`投了 ${value} 星！小一记住了～`);
  };

  return (
    <div className="flex items-center gap-1 cursor-pointer">
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesomeIcon
          key={star}
          icon={faStar}
          className={`text-2xl transition-all ${
            star <= (hover || rating) ? 'text-[var(--neon-cyan)]' : 'text-gray-600'
          } ${userHasRated ? 'opacity-50 cursor-not-allowed' : 'hover:scale-125'}`}
          onMouseEnter={() => !userHasRated && setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => handleClick(star)}
        />
      ))}
      <span className="ml-2 text-sm text-gray-400">({initialRating.toFixed(1)})</span>
    </div>
  );
}
