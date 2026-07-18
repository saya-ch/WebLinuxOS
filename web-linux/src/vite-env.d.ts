/// <reference types="vite/client" />

declare const __BUILD_TIME__: string

declare module '*.css' {
  const content: { [key: string]: string }
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}
