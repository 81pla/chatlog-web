import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: '/analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue'),
        meta: { title: '数据分析' }
      },
      {
        path: '/chatlog',
        name: 'ChatLog',
        component: () => import('@/views/ChatLog.vue'),
        meta: { title: '聊天记录' }
      },
      {
        path: '/contacts',
        name: 'Contacts',
        component: () => import('@/views/Contacts.vue'),
        meta: { title: '联系人管理' }
      },

      {
        path: '/sessions',
        name: 'Sessions',
        component: () => import('@/views/Sessions.vue'),
        meta: { title: '会话列表' }
      },

    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 