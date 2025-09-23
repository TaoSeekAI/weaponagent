import {
  BaseShapeUtil,
  TLBaseShape,
  HTMLContainer,
  Rectangle2d,
  resizeBox,
  TLResizeInfo,
} from '@tldraw/tldraw'
import { ModelViewerEmbed } from '@/components/embeds/ModelViewerEmbed'

// 定义3D模型查看器形状类型
export type ModelViewerShape = TLBaseShape<
  'model-viewer',
  {
    url: string
    w: number
    h: number
  }
>

export class ModelViewerShapeUtil extends BaseShapeUtil<ModelViewerShape> {
  static override type = 'model-viewer' as const
  static override props = {
    url: '',
    w: 400,
    h: 300,
  }

  override isAspectRatioLocked = () => false
  override canResize = () => true
  override canBind = () => false

  getDefaultProps(): ModelViewerShape['props'] {
    return {
      url: '',
      w: 400,
      h: 300,
    }
  }

  getGeometry(shape: ModelViewerShape): Rectangle2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override onResize = (
    shape: ModelViewerShape,
    info: TLResizeInfo<ModelViewerShape>
  ): ModelViewerShape => {
    return resizeBox(shape, info)
  }

  component(shape: ModelViewerShape) {
    const { url, w, h } = shape.props

    if (!url) {
      return (
        <HTMLContainer style={{ width: w, height: h }}>
          <div className="flex items-center justify-center w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded">
            <div className="text-center">
              <p className="text-gray-500 mb-2">3D Model Viewer</p>
              <p className="text-xs text-gray-400">Drop a .glb or .gltf file here</p>
            </div>
          </div>
        </HTMLContainer>
      )
    }

    return (
      <HTMLContainer style={{ width: w, height: h }}>
        <ModelViewerEmbed
          url={url}
          width={w}
          height={h}
        />
      </HTMLContainer>
    )
  }

  indicator(shape: ModelViewerShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}