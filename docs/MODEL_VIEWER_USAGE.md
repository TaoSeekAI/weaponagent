# Model-Viewer 3D模型查看器使用指南

## 概述
项目中集成了Google的`@google/model-viewer`组件，支持在tldraw画布中嵌入和查看3D模型。

## 功能特性
- 支持GLB/GLTF格式3D模型
- 相机控制（旋转、缩放、平移）
- 自动旋转
- AR增强现实支持
- 阴影和光照控制
- 文件上传功能

## 组件位置
`apps/web/src/components/embeds/ModelViewerEmbed.tsx`

## 如何在tldraw中插入3D模型

### 方法1：通过自定义工具栏添加
```typescript
// 在TldrawBoard组件中添加自定义工具
import { ModelViewerEmbed } from '@/components/embeds/ModelViewerEmbed'

// 添加自定义形状类型
const customShapeUtils = [
  {
    type: 'model-viewer',
    component: ModelViewerEmbed,
    defaultProps: {
      url: '/models/sample.glb',
      width: 400,
      height: 300
    }
  }
]

// 在Tldraw组件中使用
<Tldraw
  shapeUtils={customShapeUtils}
  onMount={handleMount}
/>
```

### 方法2：通过编程方式插入
```typescript
// 在画布中程序化创建3D模型查看器
const insertModelViewer = (editor: Editor, x: number, y: number) => {
  editor.createShape({
    type: 'embed',
    x: x,
    y: y,
    props: {
      url: '/models/sample.glb',
      w: 400,
      h: 300,
      embedType: 'model-viewer'
    }
  })
}

// 使用示例
const handleAddModel = () => {
  if (editor) {
    insertModelViewer(editor, 100, 100)
  }
}
```

### 方法3：通过拖放添加
```typescript
// 实现拖放3D模型文件到画布
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]

  if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
    const url = URL.createObjectURL(file)
    const point = editor.screenToPage({ x: e.clientX, y: e.clientY })

    editor.createShape({
      type: 'embed',
      x: point.x,
      y: point.y,
      props: {
        url: url,
        w: 400,
        h: 300,
        embedType: 'model-viewer'
      }
    })
  }
}
```

## 完整实现示例

### 1. 创建自定义Shape工具
```typescript
// apps/web/src/lib/custom-shapes/ModelViewerShape.ts
import { BaseBoxShapeTool, TLEmbedShape } from '@tldraw/tldraw'

export class ModelViewerShapeTool extends BaseBoxShapeTool {
  static override id = 'model-viewer'
  static override initial = 'idle'

  override shapeType = 'embed'

  override onDoubleClick = (info: TLPointerEventInfo) => {
    // 双击时打开文件选择器
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.glb,.gltf'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        this.createModelViewer(info.point, url)
      }
    }
    input.click()
  }

  createModelViewer(point: { x: number; y: number }, url: string) {
    this.editor.createShape({
      type: 'embed',
      x: point.x,
      y: point.y,
      props: {
        url: url,
        w: 400,
        h: 300,
        embedType: 'model-viewer'
      }
    })
  }
}
```

### 2. 注册到tldraw
```typescript
// apps/web/src/components/canvas/TldrawBoard.tsx
import { Tldraw, Editor } from '@tldraw/tldraw'
import { ModelViewerShapeTool } from '@/lib/custom-shapes/ModelViewerShape'
import { ModelViewerEmbed } from '@/components/embeds/ModelViewerEmbed'

const tools = [ModelViewerShapeTool]

const components = {
  Embed: (props: { shape: TLEmbedShape }) => {
    if (props.shape.props.embedType === 'model-viewer') {
      return <ModelViewerEmbed shape={props.shape} />
    }
    // 返回默认embed组件
    return null
  }
}

export function TldrawBoard({ roomId }: TldrawBoardProps) {
  return (
    <Tldraw
      tools={tools}
      components={components}
      onMount={handleMount}
    />
  )
}
```

### 3. 添加UI按钮
```typescript
// 在工具栏添加3D模型按钮
const Toolbar = () => {
  const editor = useEditor()

  const handleAddModel = () => {
    // 激活model-viewer工具
    editor.setCurrentTool('model-viewer')
  }

  return (
    <button
      onClick={handleAddModel}
      className="toolbar-button"
      title="添加3D模型"
    >
      <Icon3D />
      3D模型
    </button>
  )
}
```

## 支持的3D模型格式
- `.glb` - 二进制GLTF格式（推荐）
- `.gltf` - JSON格式的GLTF

## 模型查看器控制选项
```typescript
interface ModelViewerProps {
  src: string              // 3D模型URL
  poster?: string          // 加载时显示的海报图片
  'camera-controls': boolean  // 启用相机控制
  'auto-rotate': boolean      // 自动旋转
  ar: boolean                 // AR支持
  'ar-modes': string         // AR模式
  exposure: number           // 曝光度 (0-2)
  'shadow-intensity': number // 阴影强度 (0-1)
  'shadow-softness': number  // 阴影柔和度 (0-1)
}
```

## 使用建议

1. **模型优化**：使用压缩的GLB格式，文件大小建议在10MB以内
2. **性能考虑**：避免在同一画布中加载过多3D模型
3. **交互设计**：为用户提供清晰的添加3D模型入口
4. **错误处理**：处理模型加载失败的情况

## 示例模型资源
可以从以下网站获取免费的3D模型：
- [Sketchfab](https://sketchfab.com)
- [Google Poly](https://poly.google.com)
- [Three.js Examples](https://threejs.org/examples/)

## 常见问题

### Q: 如何预加载3D模型？
```typescript
// 在应用启动时预加载
const preloadModels = [
  '/models/chair.glb',
  '/models/table.glb'
]

preloadModels.forEach(url => {
  fetch(url).then(r => r.blob())
})
```

### Q: 如何限制模型文件大小？
```typescript
const handleFileUpload = (file: File) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    alert('文件太大，请选择小于10MB的模型')
    return
  }
  // 处理文件...
}
```

### Q: 如何保存模型到画布状态？
模型URL会自动保存在shape的props中，通过tldraw的持久化系统自动处理。

## 完整使用流程
1. 用户点击"添加3D模型"按钮
2. 选择或拖放GLB/GLTF文件
3. 模型自动加载到画布中
4. 可以移动、缩放、删除模型
5. 支持多用户实时协作查看

## 下一步扩展
- 添加模型库预设
- 支持更多3D格式（OBJ, FBX等）
- 添加模型编辑功能（材质、动画）
- 集成物理引擎
- 支持多模型组合