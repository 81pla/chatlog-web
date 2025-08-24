<template>
  <div class="chatlog-page">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form 
        ref="searchForm" 
        :model="searchParams" 
        label-width="100px"
        @submit.prevent="handleSearch"
      >
        <!-- 第一行：主要搜索条件 -->
        <el-row :gutter="20" class="search-row">
          <el-col :span="7">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled-date="disabledDate"
                :shortcuts="dateShortcuts"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="聊天对象">
              <el-select
                v-model="searchParams.talker"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入聊天对象"
                style="width: 100%"
                @change="handleTalkerChange"
              >
                <el-option
                  v-for="item in talkerOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="9">
            <el-form-item label="关键词">
              <el-select
                v-model="searchParams.keyword"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入关键词"
                style="width: 100%"
                @change="handleKeywordChange"
              >
                <el-option
                  v-for="item in keywordOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第二行：高级选项和操作按钮 -->
        <el-row :gutter="20" class="search-row advanced-options">
          <el-col :span="5">
            <el-form-item label="搜索模式">
              <el-radio-group v-model="searchMode" size="small">
                <el-radio value="and">全部匹配</el-radio>
                <el-radio value="or">任意匹配</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="数据格式">
              <el-select v-model="searchParams.format" size="small" style="width: 100%">
                <el-option label="JSON" value="json" />
                <el-option label="CSV" value="csv" />
                <el-option label="纯文本" value="text" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="每页数量">
              <el-select v-model="searchParams.limit" size="small" style="width: 100%">
                <el-option label="20条" :value="20" />
                <el-option label="50条" :value="50" />
                <el-option label="100条" :value="100" />
                <el-option label="200条" :value="200" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label=" " class="button-form-item">
              <div class="button-group">
                <el-button type="primary" @click="handleSearch" :loading="loading">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="handleReset">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
                <el-button 
                  type="success" 
                  @click="handleExport"
                  :disabled="!chatLogs.length"
                >
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 搜索条件预览 -->
        <div v-if="searchParams.talker.length || searchParams.keyword.length" class="search-preview">
          <div class="preview-title">当前搜索条件：</div>
          <div class="preview-tags">
            <el-tag 
              v-for="talker in searchParams.talker" 
              :key="talker"
              type="primary"
              closable
              @close="removeTalker(talker)"
            >
              群聊: {{ talker }}
            </el-tag>
            <el-tag 
              v-for="keyword in searchParams.keyword" 
              :key="keyword"
              type="success"
              closable
              @close="removeKeyword(keyword)"
            >
              关键词: {{ keyword }}
            </el-tag>
          </div>
          <div class="preview-mode">
            <el-text type="info">
              搜索模式: {{ searchMode === 'and' ? '全部匹配（AND）' : '任意匹配（OR）' }}
            </el-text>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 聊天记录列表 -->
    <div class="card">
      <div class="card-header">
        <h3>聊天记录 ({{ total }} 条)</h3>
        <div class="search-info">
          <span v-if="searchParams.talker.length">
            搜索对象: {{ searchParams.talker.length }}个
          </span>
          <span v-if="searchParams.keyword.length">
            关键词: {{ searchParams.keyword.length }}个
          </span>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="10" animated />
        </div>
        <div v-else-if="!chatLogs.length" class="empty-state">
          <el-empty description="暂无聊天记录" />
        </div>
        <div v-else class="chat-messages">
          <div 
            v-for="(message, index) in chatLogs" 
            :key="index"
            class="chat-message-wrapper"
            :class="{ 'is-self': isSelfMessage(message) }"
          >
            <div class="chat-message" :class="{ 'self-message': isSelfMessage(message) }">
              <div class="message-avatar" v-if="!isSelfMessage(message)">
                <el-avatar :size="36" class="sender-avatar" :style="{ backgroundColor: getAvatarColor(message.senderName) }">
                  {{ getSenderInitial(message.senderName) }}
                </el-avatar>
              </div>
              
              <div class="message-body">
                <div class="message-info">
                  <span class="sender-name" :class="{ 'self-name': isSelfMessage(message) }">
                    {{ message.senderName || '未知' }}
                  </span>
                  <span class="message-time">{{ formatTime(message.time) }}</span>
                  
                  <!-- 标签信息 -->
                  <div class="message-tags" v-if="message.senderId || getMatchedKeywords(message.content).length > 0">
                    <el-tag 
                      v-if="message.senderId" 
                      size="small" 
                      type="info"
                      class="talker-tag"
                    >
                      {{ message.senderId }}
                    </el-tag>
                    <el-tag 
                      v-if="getMatchedKeywords(message.content).length > 0"
                      size="small"
                      type="success"
                      effect="light"
                      class="keyword-tag"
                    >
                      匹配: {{ getMatchedKeywords(message.content).join(', ') }}
                    </el-tag>
                  </div>
                </div>
                
                <div class="message-content" :class="{ 'self-content': isSelfMessage(message) }">
                  <!-- 解析消息内容中的多媒体格式 -->
                  <div v-if="message.content && message.content.includes('![图片]')" class="text-message">
                    <div v-html="parseMediaContent(message.content)"></div>
                  </div>
                  <div v-else-if="message.content && message.content.includes('![视频]')" class="text-message">
                    <div v-html="parseMediaContent(message.content)"></div>
                  </div>
                  <div v-else-if="message.content && message.content.includes('![语音]')" class="text-message">
                    <div v-html="parseMediaContent(message.content)"></div>
                  </div>
                  <div v-else-if="message.content && message.content.includes('![文件]')" class="text-message">
                    <div v-html="parseMediaContent(message.content)"></div>
                  </div>
                  <div v-else class="text-message">
                    <span v-html="highlightKeywords(message.content || '空消息')"></span>
                  </div>
                </div>
              </div>
              
              <div class="message-avatar" v-if="isSelfMessage(message)">
                <el-avatar :size="36" class="sender-avatar self-avatar" :style="{ backgroundColor: getAvatarColor(message.senderName) }">
                  {{ getSenderInitial(message.senderName) }}
                </el-avatar>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="chatLogs.length" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="searchParams.limit"
            :page-sizes="[20, 50, 100, 200]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="imagePreviewVisible"
      title="图片预览"
      width="50%"
    >
      <img 
        :src="previewImageUrl"
        style="width: 100%; max-height: 500px; object-fit: contain;"
        alt="预览图片"
      />
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { saveAs } from 'file-saver'
import api from '@/api'

export default {
  name: 'ChatLog',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const dateRange = ref(['', ''])
    const searchParams = reactive({
      time: '',
      talker: [], // 改为数组支持多选
      keyword: [], // 改为数组支持多选
      format: 'json',
      limit: 20,
      offset: 0
    })
    const searchMode = ref('and') // 搜索模式：and 或 or
    const currentPage = ref(1)
    const total = ref(0)
    const chatLogs = ref([])
    const imagePreviewVisible = ref(false)
    const previewImageUrl = ref('')
    
    // 选项数据
    const talkerOptions = ref([])
    const keywordOptions = ref([])
    
    // 用于存储历史搜索记录
    const searchHistory = ref({
      talkers: [],
      keywords: []
    })

    // 日期快捷选择选项
    const dateShortcuts = [
      {
        text: '今天',
        value: () => {
          const today = dayjs()
          return [today.format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
        }
      },
      {
        text: '昨天',
        value: () => {
          const yesterday = dayjs().subtract(1, 'day')
          return [yesterday.format('YYYY-MM-DD'), yesterday.format('YYYY-MM-DD')]
        }
      },
      {
        text: '最近7天',
        value: () => {
          const end = dayjs()
          const start = end.subtract(6, 'day')
          return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
        }
      },
      {
        text: '最近30天',
        value: () => {
          const end = dayjs()
          const start = end.subtract(29, 'day')
          return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
        }
      }
    ]

    // 禁用未来日期
    const disabledDate = (time) => {
      return time.getTime() > Date.now()
    }

    // 判断是否为自己发送的消息
    const isSelfMessage = (message) => {
      // "未知"代表自己发送的消息，应该显示在右边
      if (!message.senderName || message.senderName === '未知') {
        return true
      }
      
      // 其他可能的自己标识符
      const selfIdentifiers = ['self', 'me', '我', 'myself']
      return selfIdentifiers.some(id => 
        (message.senderId && message.senderId.toLowerCase().includes(id)) ||
        (message.senderName && message.senderName.includes(id))
      )
    }

    // 根据发送者名称生成头像颜色
    const getAvatarColor = (senderName) => {
      if (!senderName) return '#409eff'
      
      const colors = [
        '#409eff', '#67c23a', '#e6a23c', '#f56c6c', 
        '#909399', '#c71585', '#ff6347', '#32cd32',
        '#1e90ff', '#ff69b4', '#ffd700', '#8a2be2'
      ]
      
      let hash = 0
      for (let i = 0; i < senderName.length; i++) {
        hash = senderName.charCodeAt(i) + ((hash << 5) - hash)
      }
      
      return colors[Math.abs(hash) % colors.length]
    }

    // 搜索聊天记录
    const handleSearch = async () => {
      loading.value = true
      try {
        // 构建时间参数
        let timeParam = ''
        if (dateRange.value[0] && dateRange.value[1]) {
          timeParam = `${dateRange.value[0]}~${dateRange.value[1]}`
        }

        // 构建搜索参数
        const params = {
          time: timeParam,
          format: searchParams.format,
          limit: searchParams.limit,
          offset: (currentPage.value - 1) * searchParams.limit
        }

        // 处理多个聊天对象
        if (searchParams.talker.length > 0) {
          params.talker = searchParams.talker.join(',')
        }

        // 处理多个关键词
        if (searchParams.keyword.length > 0) {
          if (searchMode.value === 'and') {
            // 全部匹配模式：将关键词组合成一个查询
            params.keyword = searchParams.keyword.join(' ')
          } else {
            // 任意匹配模式：用 | 分隔关键词（支持正则表达式）
            params.keyword = searchParams.keyword.join('|')
          }
        }

        // 移除空参数
        Object.keys(params).forEach(key => {
          if (!params[key] && params[key] !== 0) {
            delete params[key]
          }
        })

        console.log('查询参数:', params)

        const response = await api.getChatLogs(params)
        chatLogs.value = response.data || []
        
        // 修复分页：如果API没有返回总数，则估算总数
        const responseTotal = response.headers['x-total-count'] || response.headers['X-Total-Count']
        if (responseTotal) {
          total.value = parseInt(responseTotal)
        } else {
          // 如果没有总数信息，根据返回的数据估算
          if (chatLogs.value.length === searchParams.limit) {
            // 如果返回的数据等于limit，说明可能还有更多数据
            total.value = (currentPage.value - 1) * searchParams.limit + chatLogs.value.length + 1
          } else {
            // 如果返回的数据少于limit，说明这是最后一页
            total.value = (currentPage.value - 1) * searchParams.limit + chatLogs.value.length
          }
        }
        
        console.log('查询结果:', chatLogs.value.length, '条记录，总数:', total.value)
        
        if (chatLogs.value.length === 0) {
          ElMessage.info('未找到匹配的聊天记录')
        } else {
          const talkerText = searchParams.talker.length > 0 ? `${searchParams.talker.length}个对象` : '所有对象'
          const keywordText = searchParams.keyword.length > 0 ? `${searchParams.keyword.length}个关键词` : '无关键词'
          ElMessage.success(`找到 ${chatLogs.value.length} 条记录 (搜索: ${talkerText}, ${keywordText})`)
        }
      } catch (error) {
        console.error('查询聊天记录失败:', error)
        ElMessage.error('查询聊天记录失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 重置搜索条件
    const handleReset = () => {
      dateRange.value = ['', '']
      searchParams.time = ''
      searchParams.talker = []
      searchParams.keyword = []
      searchParams.format = 'json'
      searchParams.limit = 20
      searchMode.value = 'and'
      currentPage.value = 1
      chatLogs.value = []
      total.value = 0
    }

    // 处理聊天对象变化
    const handleTalkerChange = (values) => {
      // 更新历史记录
      values.forEach(value => {
        if (!searchHistory.value.talkers.includes(value)) {
          searchHistory.value.talkers.unshift(value)
        }
      })
      // 限制历史记录数量
      searchHistory.value.talkers = searchHistory.value.talkers.slice(0, 20)
      updateTalkerOptions()
      saveHistory()
    }

    // 处理关键词变化
    const handleKeywordChange = (values) => {
      // 更新历史记录
      values.forEach(value => {
        if (!searchHistory.value.keywords.includes(value)) {
          searchHistory.value.keywords.unshift(value)
        }
      })
      // 限制历史记录数量
      searchHistory.value.keywords = searchHistory.value.keywords.slice(0, 20)
      updateKeywordOptions()
      saveHistory()
    }

    // 更新聊天对象选项
    const updateTalkerOptions = () => {
      talkerOptions.value = searchHistory.value.talkers.map(talker => ({
        value: talker,
        label: talker
      }))
    }

    // 更新关键词选项
    const updateKeywordOptions = () => {
      keywordOptions.value = searchHistory.value.keywords.map(keyword => ({
        value: keyword,
        label: keyword
      }))
    }

    // 移除聊天对象
    const removeTalker = (talker) => {
      const index = searchParams.talker.indexOf(talker)
      if (index > -1) {
        searchParams.talker.splice(index, 1)
      }
    }

    // 移除关键词
    const removeKeyword = (keyword) => {
      const index = searchParams.keyword.indexOf(keyword)
      if (index > -1) {
        searchParams.keyword.splice(index, 1)
      }
    }

    // 获取匹配的关键词
    const getMatchedKeywords = (content) => {
      if (!content || !searchParams.keyword.length) return []
      
      const matched = []
      searchParams.keyword.forEach(keyword => {
        if (content.includes(keyword)) {
          matched.push(keyword)
        }
      })
      return matched
    }

    // 高亮关键词
    const highlightKeywords = (content) => {
      if (!content || !searchParams.keyword.length) return content
      
      let highlightedContent = content
      searchParams.keyword.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi')
        highlightedContent = highlightedContent.replace(regex, '<span class="keyword-highlight">$1</span>')
      })
      return highlightedContent
    }

    // 导出聊天记录
    const handleExport = async () => {
      try {
        console.log('开始导出聊天记录...')
        
        // 构建时间参数
        let timeParam = ''
        if (dateRange.value[0] && dateRange.value[1]) {
          timeParam = `${dateRange.value[0]}~${dateRange.value[1]}`
        }

        const params = {
          time: timeParam,
          format: 'csv',
          limit: 5000 // 导出时增加限制，避免数据过大
        }

        // 处理多个聊天对象
        if (searchParams.talker.length > 0) {
          params.talker = searchParams.talker.join(',')
        }

        // 处理多个关键词
        if (searchParams.keyword.length > 0) {
          if (searchMode.value === 'and') {
            params.keyword = searchParams.keyword.join(' ')
          } else {
            params.keyword = searchParams.keyword.join('|')
          }
        }

        // 移除空参数
        Object.keys(params).forEach(key => {
          if (!params[key] && params[key] !== 0) {
            delete params[key]
          }
        })

        console.log('导出参数:', params)

        // 使用原始API调用，不进行解析
        const response = await api.getChatLogsRaw(params)
        console.log('导出响应:', response.data)
        
        // 处理响应数据
        let csvData = response.data
        if (typeof csvData === 'object') {
          // 如果返回的是对象，转换为CSV格式
          csvData = convertToCsv(csvData)
        } else if (typeof csvData !== 'string') {
          csvData = String(csvData)
        }
        
        // 创建Blob并下载
        const blob = new Blob([csvData], { 
          type: 'text/csv;charset=utf-8' 
        })
        const filename = `聊天记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
        saveAs(blob, filename)
        ElMessage.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败: ' + error.message)
      }
    }

    // 将对象数组转换为CSV格式
    const convertToCsv = (data) => {
      if (!Array.isArray(data) || data.length === 0) {
        return '发送者,时间,内容\n'
      }
      
      const headers = ['发送者', '时间', '内容']
      const csvHeaders = headers.join(',') + '\n'
      
      const csvRows = data.map(item => {
        const sender = item.senderName || item.sender || '未知'
        const time = item.time || item.timestamp || ''
        const content = (item.content || '').replace(/"/g, '""').replace(/,/g, '，')
        return `"${sender}","${time}","${content}"`
      }).join('\n')
      
      return csvHeaders + csvRows
    }

    // 解析消息内容中的多媒体格式
    const parseMediaContent = (content) => {
      if (!content) return ''
      
      let parsedContent = content
      
      // 解析图片 ![图片](url)
      parsedContent = parsedContent.replace(/!\[图片\]\((.*?)\)/g, (match, url) => {
        return `<img src="${url}" style="max-width: 200px; max-height: 200px; cursor: pointer; border-radius: 4px;" onclick="window.open('${url}', '_blank')" alt="图片" />`
      })
      
      // 解析视频 ![视频](url)
      parsedContent = parsedContent.replace(/!\[视频\]\((.*?)\)/g, (match, url) => {
        return `<video src="${url}" controls style="max-width: 300px; max-height: 200px; border-radius: 4px;" /></video>`
      })
      
      // 解析语音 ![语音](url)
      parsedContent = parsedContent.replace(/!\[语音\]\((.*?)\)/g, (match, url) => {
        return `<audio src="${url}" controls style="max-width: 300px;" /></audio>`
      })
      
      // 解析文件 ![文件](url)
      parsedContent = parsedContent.replace(/!\[文件\]\((.*?)\)/g, (match, url) => {
        const fileName = url.split('/').pop() || '文件'
        return `<a href="${url}" target="_blank" style="color: #409eff; text-decoration: none;">📁 ${fileName}</a>`
      })
      
      // 解析HTTP链接
      parsedContent = parsedContent.replace(/(https?:\/\/[^\s]+)/g, (match, url) => {
        return `<a href="${url}" target="_blank" style="color: #409eff; text-decoration: none;">${url}</a>`
      })
      
      return parsedContent
    }

    // 分页处理
    const handlePageChange = (page) => {
      currentPage.value = page
      handleSearch()
    }

    // 页面大小改变处理
    const handleSizeChange = (size) => {
      searchParams.limit = size
      currentPage.value = 1
      handleSearch()
    }

    // 获取多媒体URL
    const getMediaUrl = (type, id) => {
      switch (type) {
        case 'image':
          return api.getImageUrl(id)
        case 'video':
          return api.getVideoUrl(id)
        case 'voice':
          return api.getVoiceUrl(id)
        case 'file':
          return api.getFileUrl(id)
        default:
          return ''
      }
    }

    // 图片预览
    const previewImage = (imageId) => {
      previewImageUrl.value = api.getImageUrl(imageId)
      imagePreviewVisible.value = true
    }

    // 下载文件
    const downloadFile = (fileId) => {
      const url = api.getFileUrl(fileId)
      window.open(url, '_blank')
    }

    // 获取发送者首字母
    const getSenderInitial = (sender) => {
      if (!sender) return '?'
      return sender.charAt(0).toUpperCase()
    }

    // 格式化时间
    const formatTime = (time) => {
      return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }

    // 初始化历史记录
    const initializeHistory = () => {
      try {
        const savedHistory = localStorage.getItem('chatlog-search-history')
        if (savedHistory) {
          const history = JSON.parse(savedHistory)
          searchHistory.value = {
            talkers: history.talkers || [],
            keywords: history.keywords || []
          }
          updateTalkerOptions()
          updateKeywordOptions()
        }
      } catch (error) {
        console.warn('恢复搜索历史失败:', error)
      }
    }

    // 保存历史记录
    const saveHistory = () => {
      try {
        localStorage.setItem('chatlog-search-history', JSON.stringify(searchHistory.value))
      } catch (error) {
        console.warn('保存搜索历史失败:', error)
      }
    }

    // 监听搜索历史变化并保存
    const saveHistoryOnChange = () => {
      saveHistory()
    }

    // 组件挂载时初始化
    onMounted(() => {
      initializeHistory()
    })

    return {
      loading,
      dateRange,
      searchParams,
      searchMode,
      currentPage,
      total,
      chatLogs,
      imagePreviewVisible,
      previewImageUrl,
      talkerOptions,
      keywordOptions,
      handleSearch,
      handleReset,
      handleExport,
      handlePageChange,
      handleSizeChange,
      getMediaUrl,
      previewImage,
      downloadFile,
      getSenderInitial,
      formatTime,
      parseMediaContent,
      getMatchedKeywords,
      highlightKeywords,
      removeTalker,
      removeKeyword,
      handleTalkerChange,
      handleKeywordChange,
      updateTalkerOptions,
      updateKeywordOptions,
      initializeHistory,
      saveHistory,
      dateShortcuts,
      disabledDate,
      isSelfMessage,
      getAvatarColor
    }
  }
}
</script>

<style scoped>
.chatlog-page {
  padding: 20px;
}

.search-form {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  border: 1px solid #f0f0f0;
}

.search-row {
  margin-bottom: 16px;
}

.search-row:last-child {
  margin-bottom: 0;
}

.advanced-options {
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.button-form-item {
  margin-bottom: 0 !important;
}

.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-start;
}

.search-preview {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.preview-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.preview-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.preview-mode {
  font-size: 13px;
}

.chat-messages {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.chat-message-wrapper {
  margin-bottom: 16px;
}

.chat-message-wrapper.is-self {
  display: flex;
  justify-content: flex-end;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  max-width: 70%;
  gap: 10px;
}

.chat-message.self-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.sender-avatar {
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.sender-name {
  font-weight: 500;
  color: #666;
  font-size: 13px;
}

.self-name {
  color: #666;
  text-align: right;
}

.message-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.message-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.message-content {
  background: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  word-wrap: break-word;
  line-height: 1.5;
  font-size: 14px;
  color: #333;
}

.message-content::before {
  content: '';
  position: absolute;
  top: 10px;
  left: -6px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #fff;
}

.self-content {
  background: #95ec69;
  color: #333;
}

.self-content::before {
  left: auto;
  right: -6px;
  border-right: none;
  border-left: 6px solid #95ec69;
}

.text-message {
  margin: 0;
}

.keyword-highlight {
  background: #ffeb3b;
  color: #333;
  padding: 1px 3px;
  border-radius: 3px;
  font-weight: 500;
}

.self-content .keyword-highlight {
  background: rgba(255, 255, 255, 0.8);
  color: #333;
}

/* 聊天记录卡片样式 */
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.card-body {
  padding: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.message-sender {
  display: flex;
  align-items: center;
}

.sender-avatar {
  margin-right: 10px;
}

.sender-name {
  font-weight: 600;
  color: #409eff;
  margin-right: 10px;
}

.talker-tag {
  margin-left: 10px;
}

.message-time {
  color: #909399;
  font-size: 12px;
}

.message-content {
  line-height: 1.6;
}

.text-message {
  word-wrap: break-word;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image:hover {
  transform: scale(1.05);
}

.message-video {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
}

.message-audio {
  width: 100%;
  max-width: 300px;
}

.file-message {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: inline-block;
}

.other-message {
  padding: 10px;
  background-color: #fff3cd;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 50px;
}

.loading {
  padding: 20px;
}

/* 新增功能样式 */
.input-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.2;
}

.search-preview {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  margin-top: 20px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 10px;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.preview-tags .el-tag {
  margin: 0;
}

.preview-mode {
  font-size: 12px;
}

.search-info {
  display: flex;
  gap: 15px;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.search-info span {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background-color: #e1f3ff;
  border-radius: 4px;
  font-size: 12px;
}

.keyword-tag {
  margin-left: 10px;
}

.keyword-highlight {
  background-color: #fff3cd;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
  color: #856404;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 20px;
}

.card-body {
  padding: 0;
}

.search-form {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-form .el-form-item {
  margin-bottom: 18px;
}

.search-form .el-form-item__label {
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .message-sender {
    margin-bottom: 5px;
  }
  
  .message-image,
  .message-video {
    max-width: 100%;
  }
  
  .search-info {
    flex-direction: column;
    gap: 5px;
    align-items: flex-start;
  }
  
  .preview-tags {
    flex-direction: column;
    gap: 5px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .chatlog-page {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .search-form {
    padding: 15px;
  }
  
  .search-form .el-col {
    width: 100%;
  }
  
  .search-form .el-row {
    flex-direction: column;
  }
}
</style> 