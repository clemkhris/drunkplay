"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faDice, faRotate, faTrash, faStar, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import StarRating from '@/components/StarRating';   // ← adjust path if your folder is different

interface Game {
  id: number;
  title: string;
  duration: string;
  setup: string;
  tools: string;
  description: string;
  winning_conditions: string;
  players: number;
  video: string;
  scene: string;
  dimensions: string[];
  score: number;
  image: string;
}

interface Cocktail {
  id: number;
  name: string;
  category?: string;
  main_alcohol: string;
  materials: string[];
  steps: string[];
  taste: string;
  strength: number;        // 1-10
  difficulty?: string;
  image?: string;
  tips?: string;
}

const initialGames: Game[] = [
];
const scenes = ["全部", "酒吧", "KTV", "家庭", "户外", "餐厅", "轰趴"];
const dimensionsList = ["认知推理", "情感表达", "动作反应", "运气", "社会交往"];

export default function Home() {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [currentSceneFilter, setCurrentSceneFilter] = useState("全部");
  const [currentDimensionFilters, setCurrentDimensionFilters] = useState<string[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [currentCat, setCurrentCat] = useState<1 | 2>(1);
  const [catSpeech, setCatSpeech] = useState("这个游戏的核心在于第五轮使用回忆法，最容易赢哦～");
  const [user, setUser] = useState<any>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const router = useRouter();
  const [gameCount, setGameCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
    // Game Pagination
  const [currentGamePage, setCurrentGamePage] = useState(1);
  const gamesPerPage = 8;

  const totalPages = Math.ceil(cocktails.length / itemsPerPage);
  const currentCocktails = cocktails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
    // Game Pagination Logic
  const totalGamePages = Math.ceil(games.length / gamesPerPage);
  const currentGames = games.slice(
    (currentGamePage - 1) * gamesPerPage,
    currentGamePage * gamesPerPage
  );

  const goToNextGamePage = () => {
    if (currentGamePage < totalGamePages) setCurrentGamePage(currentGamePage + 1);
  };

  const goToPrevGamePage = () => {
    if (currentGamePage > 1) setCurrentGamePage(currentGamePage - 1);
  };

  useEffect(() => {
  const fetchGames = async () => {
    const { data, count, error } = await supabase
      .from('games')
      .select('*', { count: 'exact' })  // ← magic: get count without fetching all rows
      .eq('status', 'approved');

    if (error) {
      console.error("Fetch games error:", error);
      return;
    }

    if (data) setGames(data);
    if (count !== null) setGameCount(count);  // ← real number!

    // Fetch Cocktails
    const { data: cocktailData, error: cocktailError } = await supabase
      .from('cocktails')
      .select('*')  // ← magic: get count without fetching all rows
      .eq('status', 'approved');

    if (cocktailError) {
      console.error("Cocktails fetch error:", cocktailError);
    } else {
      console.log("Loaded cocktails:", cocktailData?.length);  // ← Add this line to debug!
      setCocktails(cocktailData || []);
    }

  };
  
  fetchGames();
}, []);

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
                <span className="text-[#00F0FF] text-sm">
                  {user.user_metadata.username || user.email}
                </span>
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
              2026 最新版 · 仅限18+
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
              <div>已收录 {gameCount} 款酒局游戏</div>
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
              onClick={() => setSelectedGame(game)}
            >
              <div className="h-48 bg-gradient-to-br from-[#9D00FF]/20 to-[#00F0FF]/20 flex items-center justify-center text-8xl">
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover rounded-t-3xl"  // Adjust class for style (cover to fit)
                  />
                ) : (
                  game.image  // Fallback to emoji if no URL
                )}
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

      {/* Game List with Random Button + Pagination */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-bold">
              全部酒局游戏 <span className="text-[var(--neon-cyan)] text-3xl">{games.length}</span>
            </h2>
            <p className="text-gray-400 mt-2">摇一摇，看今晚玩哪一款！</p>
          </div>

          <div className="flex gap-4">
            {/* Random Game Button */}
            <button
              onClick={() => {
                if (games.length === 0) return alert("还没加载游戏呢～");
                const rand = games[Math.floor(Math.random() * games.length)];
                alert(`🎲 摇到了：${rand.title}！\n\n场景：${rand.scene}\n类型：${rand.dimensions.join("、")}\n\n快去玩吧～`);
              }}
              className="px-8 py-4 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-cyan)] rounded-3xl text-lg font-medium flex items-center gap-3 hover:scale-105 transition-all shadow-lg"
            >
              <i className="fa-solid fa-dice"></i> 摇一摇随机游戏
            </button>

            {/* Reset Filter Button */}
            <button
              onClick={() => {
                setCurrentSceneFilter("全部");
                setCurrentDimensionFilters([]);
                setCurrentGamePage(1);
              }}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-3xl text-lg font-medium flex items-center gap-2 transition-all"
            >
              <i className="fa-solid fa-trash"></i> 重置筛选
            </button>
          </div>
        </div>

        {/* Games Grid - 10 per page */}
        <div className="game-grid">
          {currentGames.map((game) => (
            <div
              key={game.id}
              className="neon-card bg-[#111] border border-white/10 rounded-3xl overflow-hidden cursor-pointer"
              onClick={() => setSelectedGame(game)}
            >
              <div className="h-48 bg-gradient-to-br from-[#9D00FF]/20 to-[#00F0FF]/20 flex items-center justify-center text-8xl overflow-hidden">
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "🎲"
                )}
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-medium mb-1">{game.title}</h3>
                <p className="text-xs text-gray-400">
                  {game.scene} • {game.dimensions.join(" · ")}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <StarRating
                    gameId={game.id}
                    initialRating={game.score || 0}
                    onRate={(newAvg) => {
                      setGames(prev => 
                        prev.map(g => 
                          g.id === game.id ? { ...g, score: Number(newAvg.toFixed(1)) } : g
                        )
                      );
                    }}
                  />
                  <div className="text-xs px-4 py-1 bg-white/10 rounded-3xl">
                    {game.players}人
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalGamePages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-16">
            <button
              onClick={goToPrevGamePage}
              disabled={currentGamePage === 1}
              className={`px-8 py-4 rounded-3xl text-lg font-medium transition-all flex items-center gap-2 ${
                currentGamePage === 1 
                  ? "bg-white/10 text-gray-500 cursor-not-allowed" 
                  : "bg-white/10 hover:bg-white/20 border border-white/30"
              }`}
            >
              ← 上一页
            </button>

            <div className="text-xl font-medium text-gray-400 px-6">
              第 {currentGamePage} 页 / 共 {totalGamePages} 页
            </div>

            <button
              onClick={goToNextGamePage}
              disabled={currentGamePage === totalGamePages}
              className={`px-8 py-4 rounded-3xl text-lg font-medium transition-all flex items-center gap-2 ${
                currentGamePage === totalGamePages 
                  ? "bg-white/10 text-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-[#9D00FF] to-[#FF00AA] hover:scale-105"
              }`}
            >
              下一页 →
            </button>
          </div>
        )}

        <div className="text-center mt-8 text-gray-500 text-sm">
          共 {games.length} 款游戏 · 每页显示 10 款
        </div>
      </section>
            {/* Cocktails Block with Real Pagination */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-gradient-to-b from-black to-[#1a0033]">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[var(--neon-pink)] text-sm tracking-widest">TONIGHT'S POISON</div>
            <h2 className="text-5xl font-bold [font-family:var(--font-orbitron)] flex items-center gap-3">
              🍹 Drunk Cocktails <span className="text-3xl">🔥</span>
            </h2>
            <p className="text-gray-400 mt-2">Pick your poison. Shake it. Light it. Down it.</p>
          </div>
          
          <button
            onClick={() => {
              if (cocktails.length === 0) return alert("还没加载酒呢～");
              const rand = cocktails[Math.floor(Math.random() * cocktails.length)];
              setSelectedCocktail(rand);
            }}
            className="px-8 py-4 bg-gradient-to-r from-[#FF00AA] to-[#00F0FF] rounded-3xl text-lg font-medium flex items-center gap-3 hover:scale-105 transition-all"
          >
            <i className="fa-solid fa-dice"></i> Shake Random Drink
          </button>
        </div>

        {/* Cocktail Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentCocktails.map((cocktail) => (
            <div
              key={cocktail.id}
              className="neon-card bg-[#111] border border-white/10 rounded-3xl overflow-hidden cursor-pointer group"
              onClick={() => setSelectedCocktail(cocktail)}
            >
              <div className="h-56 bg-gradient-to-br from-[#FF00AA]/20 to-[#00F0FF]/20 relative overflow-hidden">
                {cocktail.image ? (
                  <img
                    src={cocktail.image}
                    alt={cocktail.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-9xl opacity-70">🍸</div>
                )}
                <div className="absolute top-4 right-4 bg-black/90 px-4 py-1 rounded-2xl text-sm font-bold border border-[#FF00AA]/70">
                  {cocktail.strength}/10 🔥
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-medium mb-1">{cocktail.name}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {cocktail.main_alcohol} • {cocktail.category || "Classic"}
                </p>
                <div className="text-sm text-gray-300 line-clamp-2">{cocktail.taste}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-16">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`px-8 py-4 rounded-3xl text-lg font-medium transition-all flex items-center gap-2 ${
                currentPage === 1 
                  ? "bg-white/10 text-gray-500 cursor-not-allowed" 
                  : "bg-white/10 hover:bg-white/20 border border-white/30"
              }`}
            >
              ← 上一页
            </button>

            <div className="text-xl font-medium text-gray-400">
              {currentPage} / {totalPages}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-8 py-4 rounded-3xl text-lg font-medium transition-all flex items-center gap-2 ${
                currentPage === totalPages 
                  ? "bg-white/10 text-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-[#9D00FF] to-[#FF00AA] hover:scale-105"
              }`}
            >
              下一页 →
            </button>
          </div>
        )}

        <div className="text-center mt-8 text-gray-500 text-sm">
          共 {cocktails.length} 款酒 · 每页显示 6 款
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
      {/* Game Detail Modal */}
      {selectedGame && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[10000] flex items-center justify-center p-4"
          onClick={() => setSelectedGame(null)}
        >
          <div 
            className="bg-[#0F0F0F] border border-[var(--neon-cyan)]/50 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 头部图片 */}
            <div className="h-64 relative">
              {selectedGame.image ? (
                <img 
                  src={selectedGame.image} 
                  alt={selectedGame.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-9xl">
                  🎲
                </div>
              )}
              <div className="absolute top-4 right-4 bg-black/80 px-5 py-1 rounded-2xl text-sm">
                {selectedGame.scene} · {selectedGame.players}人
              </div>
            </div>

            {/* 内容区 - 重点：这里要能滚动 */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-280px)]">
              <h2 className="text-4xl font-bold mb-6 neon-text-cyan">{selectedGame.title}</h2>
              
              <div className="space-y-8 text-lg">
                <div>
                  <div className="text-[var(--neon-purple)] text-sm mb-2">游戏描述</div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedGame.description}
                  </p>
                </div>

                <div>
                  <div className="text-[var(--neon-purple)] text-sm mb-2">准备工具</div>
                  <p className="text-gray-200">{selectedGame.tools}</p>
                </div>

                <div>
                  <div className="text-[var(--neon-purple)] text-sm mb-2">前置条件</div>
                  <p className="text-gray-200">{selectedGame.setup}</p>
                </div>

                <div>
                  <div className="text-[var(--neon-purple)] text-sm mb-2">输赢规则</div>
                  <p className="text-gray-200 whitespace-pre-wrap">{selectedGame.winning_conditions}</p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between text-sm">
                    <span>时长：{selectedGame.duration}</span>
                    <span>类型：{selectedGame.dimensions.join("、")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-6 border-t border-white/10 flex gap-4">
              <button 
                onClick={() => setSelectedGame(null)}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition"
              >
                关掉
              </button>
              <button 
                onClick={() => alert("已复制到剪贴板～今晚玩这个！")}
                className="flex-1 py-4 bg-gradient-to-r from-[#9D00FF] to-[#00F0FF] rounded-2xl font-medium"
              >
                复制给朋友一起玩
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cocktail Detail Modal - 修复版 */}
      {selectedCocktail && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[10000] flex items-center justify-center p-4"
          onClick={() => setSelectedCocktail(null)}
        >
          <div 
            className="bg-[#0F0F0F] border border-[var(--neon-pink)]/60 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 头部图片 + 强度标签 */}
            <div className="relative h-64 flex-shrink-0">
              {selectedCocktail.image ? (
                <img 
                  src={selectedCocktail.image} 
                  alt={selectedCocktail.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center text-9xl">
                  🍹
                </div>
              )}
              
              <div className="absolute top-6 right-6 bg-black/90 px-6 py-2 rounded-3xl text-2xl font-bold border border-[#FF00AA] flex items-center gap-2">
                {selectedCocktail.strength}/10 <span className="text-xl">🔥</span>
              </div>
            </div>

            {/* 可滚动的内容区 */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div>
                <h2 className="text-5xl font-bold mb-2 neon-text-pink">{selectedCocktail.name}</h2>
                <p className="text-[var(--neon-cyan)] text-xl">
                  {selectedCocktail.main_alcohol} • {selectedCocktail.category || "Classic"}
                </p>
              </div>

              {/* TASTE */}
              <div>
                <div className="text-[var(--neon-pink)] text-sm mb-3 tracking-widest">TASTE 味道</div>
                <p className="text-gray-200 leading-relaxed text-lg">{selectedCocktail.taste}</p>
              </div>

              {/* MATERIALS */}
              <div>
                <div className="text-[var(--neon-pink)] text-sm mb-3 tracking-widest">MATERIALS 材料</div>
                <ul className="space-y-2 text-gray-300">
                  {selectedCocktail.materials.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-[var(--neon-cyan)] mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* HOW TO MAKE - 自动清理序号 */}
              <div>
                <div className="text-[var(--neon-pink)] text-sm mb-3 tracking-widest">HOW TO MAKE 做法</div>
                <div className="space-y-4 text-gray-300">
                  {selectedCocktail.steps.map((step, index) => {
                    let cleanStep = step.trim()
                      .replace(/^\d+\.\s*\d+\.\s*/, '')   // 清理 "1. 1. "
                      .replace(/^\d+\.\s*/, '')           // 清理 "1. "
                      .replace(/^\d+、\s*/, '');          // 清理 "1、"

                    return (
                      <div key={index} className="flex gap-4">
                        <span className="text-[var(--neon-cyan)] font-mono shrink-0 mt-0.5">
                          {index + 1}.
                        </span>
                        <span className="leading-relaxed">{cleanStep}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedCocktail.tips && (
                <div>
                  <div className="text-[var(--neon-pink)] text-sm mb-3 tracking-widest">小贴士</div>
                  <p className="text-gray-200 italic leading-relaxed">{selectedCocktail.tips}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

