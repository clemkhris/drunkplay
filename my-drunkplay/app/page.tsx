"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faDice, faRotate, faTrash, faStar, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Game {
  id: number;
  title: string;
  scene: string;
  dimensions: string[];
  score: number;
  image: string;
  desc: string;
}

const gamesData: Game[] = [
  { id: 1, title: "霓虹国王游戏", scene: "酒吧", dimensions: ["社会交往", "运气"], score: 4.9, image: "🔥", desc: "经典升级版，输了喝一杯" },
  { id: 2, title: "蒸汽波真心话", scene: "KTV", dimensions: ["情感表达"], score: 4.8, image: "🎤", desc: "大冒险+真心话结合" },
  { id: 3, title: "猫咪动作接龙", scene: "家庭", dimensions: ["动作反应"], score: 4.7, image: "🐾", desc: "边跳边喝超有趣" },
  { id: 4, title: "扑克星座运势战", scene: "轰趴", dimensions: ["认知推理", "运气"], score: 4.6, image: "⭐", desc: "根据星座抽牌" },
  { id: 5, title: "户外啤酒接力", scene: "户外", dimensions: ["社会交往", "动作反应"], score: 4.5, image: "🏞️", desc: "夏夜必玩" },
  { id: 6, title: "餐厅猜酒令", scene: "餐厅", dimensions: ["认知推理"], score: 4.8, image: "🍷", desc: "边吃边猜" },
];

const scenes = ["全部", "酒吧", "KTV", "家庭", "户外", "餐厅", "轰趴"];
const dimensionsList = ["认知推理", "情感表达", "动作反应", "运气", "社会交往"];

export default function Home() {
  const [games] = useState<Game[]>(gamesData);
  const [currentSceneFilter, setCurrentSceneFilter] = useState("全部");
  const [currentDimensionFilters, setCurrentDimensionFilters] = useState<string[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [currentCat, setCurrentCat] = useState<1 | 2>(1);
  const [catSpeech, setCatSpeech] = useState("这个游戏的核心在于第五轮使用回忆法，最容易赢哦～");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };
  
  const filteredGames = games.filter((g) => {
    const sceneMatch = currentSceneFilter === "全部" || g.scene === currentSceneFilter;
    const dimMatch = currentDimensionFilters.length === 0 || g.dimensions.some((d) => currentDimensionFilters.includes(d));
    return sceneMatch && dimMatch;
  });

  useEffect(() => {
    // Keyboard shortcut: press R to shake
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") shakeRecommend();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [games]);

  const shakeRecommend = () => {
    const rand = games[Math.floor(Math.random() * games.length)];
    alert(`🎲 摇到了：${rand.title}！\n\n场景：${rand.scene}\n类型：${rand.dimensions.join("、")}\n\n快去玩吧～`);
  };

  const toggleDimension = (dim: string) => {
    setCurrentDimensionFilters((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]
    );
  };

  const speakRandom = () => {
    const speeches = [
      "这个游戏超级适合 6-8 人，气氛拉满！",
      "我推荐先让最安静的人开始，效果爆炸～",
      "记得准备好手机录视频，后悔没录！",
      "输了的人要讲一个最尴尬的故事哦～",
    ];
    setCatSpeech(speeches[Math.floor(Math.random() * speeches.length)]);
  };

  const switchCat = (cat: 1 | 2) => {
    setCurrentCat(cat);
    if (cat === 1) {
      setCatSpeech("我发现这个游戏如果在第五轮使用回忆法最容易赢。<br><span class='text-xs text-gray-400'>—— 冷静分析中</span>");
    } else {
      setCatSpeech("可以在每轮加入角色扮演机制，气氛瞬间爆棚！<br><span class='text-xs text-gray-400'>—— 快来High起来！</span>");
    }
  };

  const fakeLogin = () => {
    // Simulate email input check (you can add real logic later)
    alert("🎉 登录成功！欢迎来到 DrunkPlay 酒局世界～\n\n现在你可以发布游戏、收藏、评论了！");
    setShowLogin(false);
  };

  return (
    <div className="min-h-screen relative">
      {/* NAV */}
<nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#9D00FF]/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#9D00FF] to-[#00F0FF] rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_30px_#9D00FF]">
              🃏
            </div>
            <span className="logo-font text-3xl font-bold tracking-tighter neon-text-purple">DrunkPlay</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium">
            <a href="#" className="hover:text-[#00F0FF] transition-colors">首页</a>
            <button onClick={() => setCurrentSceneFilter("全部")} className="hover:text-[#00F0FF] transition-colors">
              全部游戏
            </button>
            <a href="#" className="hover:text-[#00F0FF] transition-colors">资讯</a>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-[#00F0FF] text-sm">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-white/10 hover:bg-red-500/20 border border-white/30 rounded-3xl text-sm transition-all"
                >
                  退出
                </button>
                <a
                  href="/publish"
                  className="px-6 py-2 bg-gradient-to-r from-[#9D00FF] to-[#00F0FF] rounded-3xl text-sm font-medium"
                >
                  发布游戏
                </a>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-3xl text-sm font-medium transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-user"></i> 登录 / 注册
              </button>
            )}
          </div>
        </div>
      </nav>
      {/* HERO */}
      <header className="scanline min-h-screen pt-20 bg-[radial-gradient(at_center,#1a0033_0%,#0A0A0A_70%)] flex items-center relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 px-6 py-2 rounded-3xl text-sm border border-[var(--neon-cyan)]/30">
              <div className="w-2 h-2 bg-[var(--neon-cyan)] rounded-full animate-pulse"></div>
              2025 最新版 · 仅限18+
            </div>

            <h1 className="text-7xl lg:text-8xl font-bold leading-none tracking-tighter [font-family:var(--font-orbitron)]">
              酒中<br />自有<br /><span className="neon-text-cyan">真理</span>
            </h1>

            <p className="text-2xl text-gray-300 max-w-md">
              In vino veritas, in ludo felicitas.<br />
              <span className="text-[var(--neon-pink)]">赛博朋克酒局游戏库</span>
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={shakeRecommend}
                className="px-10 py-5 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-cyan)] rounded-3xl text-xl font-medium shadow-[0_0_40px_var(--neon-purple)] hover:shadow-[0_0_60px_var(--neon-cyan)] transition-all flex items-center gap-3"
              >
                <i className="fa-solid fa-dice"></i> 摇一摇随机游戏
              </button>

              <button
                onClick={() => setShowCatModal(true)}
                className="px-8 py-5 border-2 border-[var(--neon-pink)] rounded-3xl text-xl font-medium hover:bg-[var(--neon-pink)]/10 transition-all flex items-center gap-3"
              >
                <span className="text-3xl">🐱</span> 找小一&二二聊天
              </button>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-star text-[var(--neon-cyan)]"></i>
                <span>4.8 平均评分</span>
              </div>
              <div className="h-px w-8 bg-white/30"></div>
              <div>已收录 127 款酒局游戏</div>
            </div>
          </div>

          {/* Right side cats */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              <div
                onClick={() => { setShowCatModal(true); setCurrentCat(1); }}
                className="absolute -left-12 top-12 w-52 h-52 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-[0_0_60px_#FFAA00] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              >
                <div className="text-8xl">😺</div>
                <div className="absolute -bottom-3 -right-3 bg-black px-4 py-1 rounded-2xl text-xs font-medium border border-amber-300">
                  小一（加菲猫分析师）
                </div>
              </div>

              <div
                onClick={() => { setShowCatModal(true); setCurrentCat(2); }}
                className="w-64 h-64 bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl shadow-[0_0_80px_var(--neon-pink)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
              >
                <div className="text-9xl">🐮</div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black px-6 py-1 rounded-2xl text-xs font-medium border border-pink-300">
                  二二（奶牛猫气氛王）
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 flex gap-8 text-6xl opacity-20">
          <span>♠️</span><span>♥️</span><span>♦️</span><span>♣️</span>
        </div>
      </header>

      {/* Recommended */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[var(--neon-cyan)] text-sm tracking-widest">今日精选</div>
            <h2 className="text-5xl font-bold [font-family:var(--font-orbitron)]">猫咪为你推荐</h2>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm flex items-center gap-2 text-[var(--neon-purple)] hover:text-white transition-colors"
          >
            <i className="fa-solid fa-rotate"></i> 换一批
          </button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
          {games.slice(0, 6).map((game) => (
            <div
              key={game.id}
              className="neon-card min-w-[280px] bg-[#111] border border-white/10 rounded-3xl overflow-hidden snap-center cursor-pointer"
              onClick={() => alert(`进入游戏详情：${game.title}（后续替换为页面）`)}
            >
              <div className="h-48 bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-cyan)]/20 flex items-center justify-center text-8xl">
                {game.image}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-xl">{game.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {game.scene} · {game.dimensions.join("、")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--neon-cyan)] text-3xl font-bold">{game.score}</div>
                    <div className="text-[10px]">评分</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-black/60 border-t border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="text-sm text-[var(--neon-cyan)] mb-4">选择聚会场景</div>
            <div className="flex flex-wrap gap-3">
              {scenes.map((scene) => (
                <button
                  key={scene}
                  onClick={() => setCurrentSceneFilter(scene)}
                  className={`px-8 py-3 rounded-3xl text-sm transition-all ${
                    currentSceneFilter === scene
                      ? "bg-[var(--neon-purple)] text-white shadow-[0_0_20px_var(--neon-purple)]"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {scene}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-[var(--neon-cyan)] mb-4">选择游戏类型（可多选）</div>
            <div className="flex flex-wrap gap-3">
              {dimensionsList.map((dim) => {
                const active = currentDimensionFilters.includes(dim);
                return (
                  <button
                    key={dim}
                    onClick={() => toggleDimension(dim)}
                    className={`px-6 py-3 rounded-3xl text-sm transition-all border ${
                      active ? "border-[var(--neon-pink)] bg-[var(--neon-pink)]/10" : "border-white/30 hover:border-white/60"
                    }`}
                  >
                    {dim}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Game List */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-bold">
            全部酒局游戏 <span className="text-[var(--neon-cyan)] text-3xl">{filteredGames.length}</span>
          </h2>
          <div
            onClick={() => {
              setCurrentSceneFilter("全部");
              setCurrentDimensionFilters([]);
            }}
            className="text-sm cursor-pointer hover:text-[var(--neon-pink)] flex items-center gap-1"
          >
            <i className="fa-solid fa-trash"></i> 重置筛选
          </div>
        </div>

        <div className="game-grid">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="neon-card bg-[#111] border border-white/10 rounded-3xl overflow-hidden cursor-pointer"
              onClick={() => alert(`🎉 进入《${game.title}》详情页`)}
            >
              <div className="h-56 bg-gradient-to-br from-[var(--neon-purple)]/10 to-transparent flex items-center justify-center text-9xl">
                {game.image}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-medium mb-1">{game.title}</h3>
                <p className="text-xs text-gray-400">
                  {game.scene} • {game.dimensions.join(" · ")}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[var(--neon-cyan)]">
                    ★★★★☆ <span className="text-white ml-2 font-bold">{game.score}</span>
                  </div>
                  <div className="text-xs px-4 py-1 bg-white/10 rounded-3xl">{game.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-gradient-to-r from-[#1a0033] to-black">
        <div className="text-center mb-12">
          <div className="text-[var(--neon-pink)] text-sm tracking-widest">酒吧情报站</div>
          <h2 className="text-5xl font-bold [font-family:var(--font-orbitron)]">今晚喝点什么？</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-black/70 border border-white/10 rounded-3xl p-8 hover:border-[var(--neon-purple)] transition-colors">
            <div className="text-4xl mb-6">🔥</div>
            <h3 className="text-2xl font-medium">三步调一杯火焰 Shot</h3>
            <p className="text-gray-400 mt-3">只需龙舌兰 + 红牛 + 打火机，30秒出片，适合KTV轰趴</p>
            <div className="mt-6 text-xs text-[var(--neon-cyan)]">合作酒吧推荐</div>
          </div>
          {/* Add the other two cards similarly */}
          {/* ... */}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-8 text-4xl mb-8 opacity-30">
            ♠️ ♥️ ♦️ ♣️
          </div>
          <p className="text-sm text-gray-400">
            DrunkPlay © 2025 · 仅供成年人社交娱乐使用<br />
            未满18岁禁止饮酒 · 理性饮酒 安全第一
          </p>
          <div className="mt-8 text-[10px] text-gray-500">
            法律免责声明 | 使用条款 | 隐私政策 | 联系我们
          </div>
        </div>
      </footer>

      {/* Cat Modal */}
      {showCatModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex items-center justify-center"
          onClick={() => setShowCatModal(false)}
        >
          <div
            className="bg-[#0F0F0F] border border-[var(--neon-pink)]/60 rounded-3xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex border-b border-white/10">
              <button
                onClick={() => switchCat(1)}
                className={`flex-1 py-5 text-center font-medium ${currentCat === 1 ? "border-b-2 border-[#FFAA00] text-[#FFAA00]" : ""}`}
              >
                小一（分析师）
              </button>
              <button
                onClick={() => switchCat(2)}
                className={`flex-1 py-5 text-center font-medium ${currentCat === 2 ? "border-b-2 border-[#FFAA00] text-[#FFAA00]" : ""}`}
              >
                二二（气氛王）
              </button>
            </div>

            <div className="p-8">
              <div
                className={`mx-auto w-28 h-28 rounded-3xl flex items-center justify-center text-8xl mb-6 shadow-2xl ${
                  currentCat === 1 ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-pink-400 to-purple-500"
                }`}
              >
                {currentCat === 1 ? "😺" : "🐮"}
              </div>

              <div className="text-center text-2xl font-medium mb-2">{currentCat === 1 ? "小一" : "二二"}</div>

              <div
                className="text-gray-300 leading-relaxed text-lg min-h-[120px]"
                dangerouslySetInnerHTML={{ __html: catSpeech }}
              />
            </div>

            <div className="bg-black/60 px-8 py-6 flex justify-between text-sm">
              <button
                onClick={() => setShowCatModal(false)}
                className="px-8 py-3 rounded-2xl border border-white/30 hover:bg-white/10"
              >
                关闭
              </button>
              <button
                onClick={speakRandom}
                className="px-8 py-3 bg-[var(--neon-purple)] rounded-2xl flex items-center gap-2"
              >
                <i className="fa-solid fa-volume-high"></i> 再听一次
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
