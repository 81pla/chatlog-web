import { createStore } from 'vuex'
import api from '@/api'

export default createStore({
  state: {
    loading: false,
    contacts: [],
    chatrooms: [],
    sessions: [],
    chatLogs: [],
    currentPage: 1,
    pageSize: 20,
    total: 0,
    apiBase: 'http://127.0.0.1:3099',
    // 多源支持
    sources: [],
    currentSource: null,
    sourceLoading: false
  },
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_CONTACTS(state, contacts) {
      state.contacts = contacts
    },
    SET_CHATROOMS(state, chatrooms) {
      state.chatrooms = chatrooms
    },
    SET_SESSIONS(state, sessions) {
      state.sessions = sessions
    },
    SET_CHAT_LOGS(state, logs) {
      state.chatLogs = logs
    },
    SET_PAGINATION(state, { page, pageSize, total }) {
      state.currentPage = page
      state.pageSize = pageSize
      state.total = total
    },
    SET_API_BASE(state, base) {
      state.apiBase = base
    },
    // 多源支持的 mutations
    SET_SOURCES(state, sources) {
      state.sources = sources
    },
    SET_CURRENT_SOURCE(state, source) {
      state.currentSource = source
      // 保存到 localStorage
      if (source) {
        localStorage.setItem('currentSource', JSON.stringify(source))
      } else {
        localStorage.removeItem('currentSource')
      }
    },
    SET_SOURCE_LOADING(state, loading) {
      state.sourceLoading = loading
    }
  },
  actions: {
    // 初始化应用，加载数据源和恢复当前选择的源
    async initApp({ commit, dispatch }) {
      try {
        // 加载数据源列表
        await dispatch('fetchSources')
        
        // 尝试从 localStorage 恢复当前源
        const savedSource = localStorage.getItem('currentSource')
        if (savedSource) {
          try {
            const source = JSON.parse(savedSource)
            commit('SET_CURRENT_SOURCE', source)
          } catch (e) {
            console.warn('恢复保存的数据源失败:', e)
          }
        }
      } catch (error) {
        console.error('初始化应用失败:', error)
      }
    },
    
    // 获取数据源列表
    async fetchSources({ commit }) {
      commit('SET_SOURCE_LOADING', true)
      try {
        const response = await api.getSources()
        commit('SET_SOURCES', response.data)
        return response.data
      } catch (error) {
        console.error('获取数据源失败:', error)
        throw error
      } finally {
        commit('SET_SOURCE_LOADING', false)
      }
    },
    
    // 测试数据源连接
    async testSource({ commit }, sourceId) {
      try {
        const response = await api.testSource(sourceId)
        return response.data
      } catch (error) {
        console.error('测试数据源连接失败:', error)
        throw error
      }
    },
    
    async fetchContacts({ commit, state }) {
      if (!state.currentSource) {
        throw new Error('请先选择数据源')
      }
      
      commit('SET_LOADING', true)
      try {
        const response = await api.getContacts(state.currentSource.source_id)
        commit('SET_CONTACTS', response.data)
      } catch (error) {
        console.error('获取联系人失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchChatrooms({ commit, state }) {
      if (!state.currentSource) {
        throw new Error('请先选择数据源')
      }
      
      commit('SET_LOADING', true)
      try {
        const response = await api.getChatrooms(state.currentSource.source_id)
        commit('SET_CHATROOMS', response.data)
      } catch (error) {
        console.error('获取群聊失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchSessions({ commit, state }) {
      if (!state.currentSource) {
        throw new Error('请先选择数据源')
      }
      
      commit('SET_LOADING', true)
      try {
        const response = await api.getSessions(state.currentSource.source_id)
        commit('SET_SESSIONS', response.data)
      } catch (error) {
        console.error('获取会话失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchChatLogs({ commit, state }, params) {
      if (!state.currentSource) {
        throw new Error('请先选择数据源')
      }
      
      commit('SET_LOADING', true)
      try {
        const response = await api.getChatLogs({
          ...params,
          source: state.currentSource.source_id,
          limit: state.pageSize,
          offset: (state.currentPage - 1) * state.pageSize
        })
        commit('SET_CHAT_LOGS', response.data)
        commit('SET_PAGINATION', {
          page: state.currentPage,
          pageSize: state.pageSize,
          total: response.total || 0
        })
      } catch (error) {
        console.error('获取聊天记录失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },
  getters: {
    isLoading: state => state.loading,
    getContacts: state => state.contacts,
    getChatrooms: state => state.chatrooms,
    getSessions: state => state.sessions,
    getChatLogs: state => state.chatLogs,
    getPagination: state => ({
      current: state.currentPage,
      pageSize: state.pageSize,
      total: state.total
    }),
    // 多源支持的 getters
    getSources: state => state.sources,
    getCurrentSource: state => state.currentSource,
    isSourceLoading: state => state.sourceLoading,
    hasCurrentSource: state => !!state.currentSource
  }
}) 