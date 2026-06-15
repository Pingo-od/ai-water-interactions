# AI Water Interactions

跨项目复用的 AI 水相交互动效组件库。当前第一步实现 `AICursor` 和 `CursorTrigger`。

## AICursor

负责显示/隐藏自定义 AI 光标。当前光标视觉使用 Figma 导出的 `assets/ai-cursor.svg`。

### 引入

```html
<link rel="stylesheet" href="./dist/ai-water-interactions.css" />
<script src="./dist/ai-water-interactions.js"></script>
```

### 使用

```html
<script>
  const cursor = AIWater.createCursor();

  window.addEventListener("pointermove", event => {
    cursor.moveTo(event.clientX, event.clientY);
  });

  cursor.show();
  cursor.hide();
</script>
```

## CursorTrigger

负责检测鼠标左右晃动，并在达到阈值后激活 AI 光标。

```html
<script>
  const trigger = AIWater.createCursorTrigger({
    shakeThreshold: 2,
    autoHide: false,
    cursorOptions: {
      assetUrl: "./assets/ai-cursor.svg"
    }
  });
</script>
```

### API

- `AIWater.createCursor(options)`: 创建 AI 光标实例。
- `cursor.moveTo(x, y)`: 移动 AI 光标到指定屏幕坐标。
- `cursor.show(point)`: 显示 AI 光标，并隐藏系统光标。
- `cursor.hide()`: 隐藏 AI 光标，并恢复系统光标。
- `cursor.destroy()`: 销毁组件。
- `AIWater.createCursorTrigger(options)`: 创建左右晃动触发器。
- `trigger.dismiss()`: 手动恢复系统光标。
- `trigger.destroy()`: 销毁触发器和内部光标。

## AICommandChip

负责在光标附近展示 AI 指令胶囊，可显示指令文案或语音输入文本。

```html
<script>
  const chip = AIWater.createCommandChip({
    text: "Make this more human"
  });

  chip.show({ x: 520, y: 320 });
  chip.setText("润色这段内容");
  chip.hide();
</script>
```

- `AIWater.createCommandChip(options)`: 创建指令胶囊实例。
- `chip.show(point, text)`: 在指定屏幕坐标附近显示胶囊。
- `chip.moveTo(x, y)`: 移动胶囊。
- `chip.setText(text)`: 更新文案。
- `chip.hide()`: 隐藏胶囊。
- `chip.destroy()`: 销毁胶囊。

## VoiceInputBubble

负责展示语音输入中的音波状态，并将浏览器语音识别结果更新为文字。

```html
<script>
  const bubble = AIWater.createVoiceInputBubble({
    text: "合并单元格",
    lang: "zh-CN"
  });

  bubble.startListening({ x: 520, y: 320 });
  bubble.setTranscript("合并单元格");
  bubble.hide();
</script>
```

- `AIWater.createVoiceInputBubble(options)`: 创建语音胶囊实例。
- `bubble.startListening(point)`: 显示胶囊并尝试启动浏览器语音识别。
- `bubble.stopListening()`: 停止语音识别。
- `bubble.setTranscript(text)`: 手动更新转写文字。
- `bubble.show(point, text)`: 显示胶囊。
- `bubble.hide()`: 隐藏胶囊。
- `bubble.destroy()`: 销毁胶囊。

## WaterRippleLayer

负责展示全屏水相波纹层。当前 P0-4 按 `tianxi-system-behaviors-team-morph-standalone(2).html` 中「01 唤醒」移植：每一条水波纹都从窗口底部中心向外扩散，并叠加原 demo 的折射、回弹、焦散和光环计算。

```html
<script>
  const ripple = AIWater.createWaterRippleLayer({
    fullScreen: true,
    scale: 0.54,
    sourceX: 0.5,
    sourceY: 1.06,
    autoPlay: true,
    loop: true
  });

  ripple.play();
  ripple.stop();
</script>
```

- `AIWater.createWaterRippleLayer(options)`: 创建水波层。
- `scale`: 设置水波视觉比例，默认 `0.54`。只影响波纹体量和能量，不限制最终扩散范围。
- `ripple.setBackground(drawFn)`: 可选背景采样源。需要真实背景形变时传入同一个背景绘制函数；不传时组件保持独立透明覆盖。
- `ripple.setScale(value)`: 设置水波整体比例，建议范围 `0.2-1.1`。
- `ripple.play()`: 播放一次唤醒扩散。
- `ripple.start()`: 开始自动循环。
- `ripple.stop()`: 停止并清空画布。
- `ripple.destroy()`: 销毁水波层。
- `background: "demo"`: 仅用于单独展示时启用内置蓝色背景；正式嵌入时不要设置。

## EdgeGlowLayer

负责展示贴合屏幕边缘的彩色光晕/边框状态，用柔和呼吸动效表达 AI 水相场域已激活。

```html
<script>
  const edgeGlow = AIWater.createEdgeGlowLayer({
    autoPlay: true,
    assetUrl: "./assets/edge-glow-pad-edge-only.png",
    thickness: 42,
    blur: 32,
    opacity: 0.82,
    intensity: 1
  });

  edgeGlow.start();
  edgeGlow.setOptions({ intensity: 0.78, opacity: 0.64 });
  edgeGlow.stop();
</script>
```

- `AIWater.createEdgeGlowLayer(options)`: 创建边缘光晕层。
- `assetUrl`: Figma 导出的四周光晕 PNG，默认使用已移除中心白底的 `assets/edge-glow-pad-edge-only.png`。
- `edgeGlow.start()`: 显示并开始柔和呼吸。
- `edgeGlow.stop()`: 隐藏光晕。
- `edgeGlow.toggle(force)`: 切换显示状态。
- `edgeGlow.setOptions(options)`: 更新厚度、模糊、透明度、强度或颜色。
- `edgeGlow.destroy()`: 销毁光晕层。

## TextSelectionGeneration

负责在文本区域内拖拽划词，生成 Figma 样式的蓝色水相选区，并在松开后展示 AI 生成状态。

```html
<article data-ai-text-selection>
  CentWise flips the model from Reactive to Proactive.
</article>

<script>
  const textSelection = AIWater.createTextSelectionGeneration({
    target: "[data-ai-text-selection]",
    actionText: "正在润色",
    resultText: "生成完成"
  });
</script>
```

- `AIWater.createTextSelectionGeneration(options)`: 创建划词生成组件。
- `target`: 要启用划词交互的文本容器。
- `actionText`: 松开后生成气泡里的生成中文案。
- `resultText`: 生成完成后的文案。
- `textSelection.clear()`: 清空当前选区和生成气泡。
- `textSelection.destroy()`: 销毁组件。

### CursorTrigger 参数

- `shakeThreshold`: 触发前需要识别到的方向反转次数。
- `shakeWindow`: 连续晃动的时间窗口，默认 `820ms`。
- `minShakeDistance`: 单次移动最小距离，默认 `14px`。
- `minShakeSpeed`: 单次移动最小速度，默认 `180px/s`。
- `horizontalDominance`: 横向位移相对纵向位移的比例，默认 `1.2`。数值越大，越要求接近水平左右晃动。
- `autoHide`: 是否自动恢复系统光标。设置为 `false` 后，激活后会一直保持 AI 光标。
- `activeDuration`: `autoHide` 为 `true` 时，AI 光标保持的时长。

### 示例

打开 `examples/ai-cursor-basic.html` 查看基础调用方式。
