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

export default function StarRating({ gameId, initialRating = 0, onRate }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0); // temp for hover preview
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null); // what they voted (for display)
  
useEffect(() => {
  // Part 1: 監聽登入狀態（這個沒問題，保持）
  supabase.auth.getUser().then(({ data }) => {
    setCurrentUser(data.user);
  });

  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    setCurrentUser(session?.user || null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);  // ← 只跑一次，登入狀態變化靠 listener

// Part 2: 單獨一個 effect 負責查「是否已投過票」
useEffect(() => {
  // 兩個條件缺一不可 → 才去查
  if (!currentUser?.id || !gameId) return;

  const checkIfRated = async () => {
    try {
      const { data, error } = await supabase
        .from('game_ratings')
        .select('rating')
        .eq('game_id', gameId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("查投票記錄失敗:", error);
        return;
      }

      if (data) {
        setHasVoted(true);
        setUserRating(data.rating);
        setRating(data.rating); // 顯示用戶自己投的星星
        console.log(`已投過 ${data.rating} 星，鎖定星星～`);
      } else {
        console.log("還沒投過，開放投票！");
      }
    } catch (err) {
      console.error("意外錯誤:", err);
    }
  };

  checkIfRated();
}, [currentUser?.id, gameId]);  // ← 依賴 currentUser.id 和 gameId 變化才重查

  const handleClick = async (value: number) => {
    if (hasVoted) {                 // ← 改這裡
      alert("一人一票哦～ 下輪再來High！🍻");
      return;
    }

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

  setHasVoted(true);
  setUserRating(value);
  setRating(value);
  onRate?.(newAvg);
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
        } ${
          hasVoted 
            ? 'opacity-50 cursor-not-allowed text-yellow-400/70'
            : 'hover:scale-125 hover:text-[var(--neon-cyan)]/80'
        }`}
        onMouseEnter={() => !hasVoted && setHover(star)}
        onMouseLeave={() => setHover(0)}
        onClick={() => !hasVoted && handleClick(star)}
      />
    ))}
    <span className="ml-2 text-sm text-gray-400">
      ({initialRating.toFixed(1)})
      {hasVoted && userRating && ` · 你投了 ${userRating} 星`}
    </span>
  </div>
  );
}
