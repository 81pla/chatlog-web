import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/main.css'
import 'animate.css'

// 抑制 ResizeObserver 错误（这是一个无害的开发环境错误）
const resizeObserverErrorHandler = (e) => {
  if (e.message && e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    e.stopImmediatePropagation()
    return false
  }
}

// 处理多种错误事件类型
window.addEventListener('error', resizeObserverErrorHandler)
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && e.reason.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    e.preventDefault()
    return false
  }
})

// 重写 console.error 来过滤 ResizeObserver 错误
const originalConsoleError = console.error
console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
    return
  }
  originalConsoleError.apply(console, args)
}

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(store)
app.use(router)
app.use(ElementPlus)

app.mount('#app') 