declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module 'xterm/css/xterm.css' {
  const content: any
  export default content
}