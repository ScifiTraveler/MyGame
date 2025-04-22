const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const clickSound = new Audio("assets/sounds/click.wav");

const cols = 7;
const rows = 7;
const tileSize = 100;
const totalIcons = 20; // 20 个图案编号
const iconImages ={}; // 存储编号对应图标
const lineColors = [
    "#e6194B", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000"
  ];

let score = 0;

let usedTiles = new Set();// 储存 'x_y' 格式字符串
let grid = [];
let selectedTiles = [];
let connections = [];

const scoreMap = {
  "0_1": 10,
  "0_3": 10,
  "2_1": 10,
  "2_3": 10,
  "4_5": 10,
  "6_7": 10,
  "8_9": 10,
  "10_11": 10,
  "12_13": 10,
  "14_15": 10,
  "16_17": 10,
  "18_19": 10,
  "4_1": -100,
  "3_4": -100,
};

// 初始化地图（仅最外圈填图案）
function initGrid() {
    grid = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        row.push(null);
      }
      grid.push(row);
    }
  
    // 放置图标：上下左右边缘共28格，随机放20个图标
    const positions = [];
  
    for (let i = 0; i < cols; i++) {
        if (i !== 0 && i !== cols - 1) {
          positions.push({ x: i, y: 0 });             // 顶部排除左上/右上
          positions.push({ x: i, y: rows - 1 });      // 底部排除左下/右下
        }
      }
    for (let i = 1; i < rows - 1; i++) {
      positions.push({ x: 0, y: i });
      positions.push({ x: cols - 1, y: i });
    }
  
    shuffleArray(positions);
    for (let i = 0; i < totalIcons && i < positions.length; i++) {
      const pos = positions[i];
      grid[pos.y][pos.x] = i;
    }
  }

function loadIcons(callback) {
    let loaded = 0;
    for (let i = 0; i < totalIcons; i++) {
      const img = new Image();
      img.src = `assets/icons/icon${i}.png`;

        img.onload = () => {
            loaded++;
            if (loaded === totalIcons) callback(); // 全部加载完成
        };

        iconImages[i] = img;
    }
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let val = grid[y][x];
        if (val !== null) {
          ctx.fillStyle = "#eee";
          ctx.fillRect(x * tileSize, y * tileSize, tileSize - 2, tileSize - 2);

          const img = iconImages[val];
          if (img) {
              if (usedTiles.has(`${x}_${y}`)) {
                  ctx.globalAlpha = 0.3; // 变灰效果（降低不透明度）
              } else {
                  ctx.globalAlpha = 1.0;
              }
          
              ctx.drawImage(img, x * tileSize, y * tileSize, tileSize - 2, tileSize - 2);
              ctx.globalAlpha = 1.0; // 重置透明度，避免影响其他绘图
          }
          

          // 如果这个位置在选中的图标中，绘制选中边框
          let key = `${x}_${y}`;
          if (selectedTiles.some(tile => tile.key === key)) {
            ctx.strokeStyle = "#ff0"; // 选中时边框的颜色（黄色）
            ctx.lineWidth = 4;
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize - 2, tileSize - 2); // 绘制边框 
          }
        }
      }
    }

    // 画连接线
    connections.forEach(conn => {
        ctx.beginPath();
        ctx.moveTo(conn.from.x * tileSize + tileSize / 2, conn.from.y * tileSize + tileSize / 2);
        ctx.lineTo(conn.to.x * tileSize + tileSize / 2, conn.to.y * tileSize + tileSize / 2);
        ctx.strokeStyle = conn.color;
        ctx.lineWidth = 4;
        ctx.stroke();
    });
}


function getScore(val1, val2) {
  const key1 = `${val1}_${val2}`;
  const key2 = `${val2}_${val1}`;
  return scoreMap[key1] ?? scoreMap[key2] ?? -10;
}



canvas.addEventListener("click", (e) => {  

  let x = Math.floor(e.offsetX / tileSize);
  let y = Math.floor(e.offsetY / tileSize);
  let val = grid[y][x];
  if (val === null) return;

  let key = `${x}_${y}`;
  if (usedTiles.has(key)) return;

  clickSound.currentTime = 0; // 确保每次都从头播放
  clickSound.play();// 播放点击音效
  
  const currentTile = { x, y, val, key };

  if (selectedTiles.length === 0) {
    selectedTiles.push(currentTile);
  } else {
    const prev = selectedTiles[0];
      if (prev.key === currentTile.key) {
          // 重复点击同一个图标就取消选中
          selectedTiles = [];
      } else {
          // 判断得分
          let scoreChange = getScore(prev.val, currentTile.val);
          score += scoreChange;
          scoreDisplay.textContent = `分数：${score}`;

          let color = lineColors[connections.length % lineColors.length];
          connections.push({ from: prev, to: currentTile, score: scoreChange, color });
          usedTiles.add(prev.key);
          usedTiles.add(currentTile.key);

          selectedTiles = []; // 配对完成后清空选中
      }
  }

  drawGrid();
  checkIfGameOver(); 

});



function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function checkIfGameOver() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const val = grid[y][x];
      const key = `${x}_${y}`;
      if (val !== null && !usedTiles.has(key)) {
        return; // 还有图标未连接，游戏继续
      }
    }
  }

  // 如果没 return，说明所有图标都被连接了
  alert(`恭喜你！获得了${score}分！打败了99%的泰百粉丝`);
}

const bgm = document.getElementById("bgm");

document.addEventListener("click", () => {
  bgm.volume = 0.5;
  bgm.play().catch(err => {
    console.error("背景音乐播放失败：", err);
  });
}, { once: true });


// 游戏开始时显示提示框
function showGameTip() {
  const gameTip = document.getElementById('gameTip');
  gameTip.style.display = 'block';  // 显示提示框
}

// 游戏开始按钮
function startGame() {
  const gameTip = document.getElementById('gameTip');
  gameTip.style.display = 'none';  // 隐藏提示框
  initGame();  // 这里调用初始化游戏的函数
}

// 启动游戏时调用显示提示框
window.onload = function() {
  showGameTip();
};


// 启动游戏
loadIcons(() => {
    initGrid();    
    drawGrid();
  });
