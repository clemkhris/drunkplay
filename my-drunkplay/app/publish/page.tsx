"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function PublishGame() {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [setup, setSetUP] = useState('');
  const [tools, setTools] = useState('');
  const [description, setDescription] = useState('');
  const [winning_conditions, setWinning_conditons] = useState('');
  const [scene, setScene] = useState('');
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [players, setPlayers] = useState('');
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('请先登录');
      return;
    }

    let imageUrl = '';
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image')  // Make sure this bucket exists in Supabase Storage
        .upload(`${user.id}/${Date.now()}.png`, imageFile);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('image').getPublicUrl(uploadData.path);
      imageUrl = data.publicUrl;
    }
alert('Debug: Image URL = ' + imageUrl);
    const { error: insertError } = await supabase.from('games').insert({
      title,
      tools,
      duration,
      description,
      winning_conditions,
      scene,
      dimensions,
      players,
      created_by: user.id,
      status: 'pending',  // 待审核
      video,
      image: imageUrl,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      alert('游戏提交成功！等待审核。');
      router.push('/');
    }
    setLoading(false);
  };

  const toggleDimension = (dim: string) => {
    setDimensions(prev =>
      prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-[#0F0F0F] p-10 rounded-3xl border border-[#9D00FF]/50 max-w-md w-full">
        <h1 className="text-4xl font-bold neon-text-purple text-center mb-8">发布新游戏</h1>

        <input
          type="text"
          placeholder="游戏名称 (必填)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4"
        />

        <input
          type="text"
          placeholder="游戏道具"
          value={tools}
          onChange={(e) => setTools(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4"
        />

        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4"
        >
          <option value="">选择时长</option>
          <option value="20 mins below">20分钟以内</option>
          <option value="20~60 mins">20~60分钟</option>
          <option value="over 60 mins">大于60分钟</option>
          <option value="free">自由发挥</option>
        </select>

        <textarea
          placeholder="游戏刚开始摆放步骤"
          value={setup}
          onChange={(e) => setSetUP(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4 h-32"
        />

        <textarea
          placeholder="游戏描述/游戏回合制描述"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4 h-32"
        />

        <textarea
          placeholder="输赢判定规则"
          value={winning_conditions}
          onChange={(e) => setWinning_conditons(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4 h-32"
        />

        <select
          value={scene}
          onChange={(e) => setScene(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4"
        >
          <option value="">选择场景</option>
          <option value="KTV">KTV</option>
          <option value="酒吧">酒吧</option>
          <option value="家庭">家庭</option>
          <option value="户外">户外</option>
          <option value="餐厅">餐厅</option>
          <option value="轰趴">轰趴</option>
        </select>

        <div className="mb-4">
          <p className="text-sm mb-2">游戏维度 (可多选)</p>
          <div className="flex flex-wrap gap-3">
            {['认知推理', '情感表达', '动作反应', '运气', '社会交往'].map(dim => (
              <button
                key={dim}
                onClick={() => toggleDimension(dim)}
                className={`px-4 py-2 rounded-3xl text-sm ${dimensions.includes(dim) ? 'bg-[#FF00AA]/30' : 'bg-white/10'}`}
              >
                {dim}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="适合人数 (如 2-6)"
          value={players}
          onChange={(e) => setPlayers(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-6"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full mb-6"
        />

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !title}
          className="w-full py-4 bg-gradient-to-r from-[#9D00FF] to-[#00F0FF] rounded-2xl"
        >
          {loading ? "提交中..." : "提交发布"}
        </button>
      </div>
    </div>
  );
}
