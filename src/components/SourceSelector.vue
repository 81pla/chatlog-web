<template>
  <div class="source-selector">
    <el-select
      v-model="selectedSource"
      placeholder="请选择数据源"
      :loading="sourceLoading"
      @change="handleSourceChange"
      style="width: 200px"
    >
      <el-option
        v-for="source in sources"
        :key="source.source_id"
        :label="`${source.wechat_id} - ${source.description || 'WeChat账户'}`"
        :value="source.source_id"
      >
        <div class="source-option">
          <div class="source-info">
            <span class="source-name">{{ source.wechat_id }}</span>
            <span class="source-id">{{ source.description || 'WeChat账户' }}</span>
          </div>
          <el-tag 
            :type="getConnectionStatus(source.source_id) === 'connected' ? 'success' : 'danger'"
            size="small"
          >
            {{ getConnectionStatus(source.source_id) === 'connected' ? '已连接' : '未连接' }}
          </el-tag>
        </div>
      </el-option>
    </el-select>
    
    <el-button 
      v-if="currentSource"
      @click="testConnection"
      :loading="testing"
      type="primary"
      size="small"
      style="margin-left: 8px"
    >
      测试连接
    </el-button>
    
    <el-button 
      @click="refreshSources"
      :loading="sourceLoading"
      size="small"
      style="margin-left: 8px"
    >
      刷新
    </el-button>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { ElMessage } from 'element-plus'

export default {
  name: 'SourceSelector',
  data() {
    return {
      testing: false,
      connectionStatus: {} // 存储各数据源的连接状态
    }
  },
  computed: {
    ...mapGetters(['getSources', 'getCurrentSource', 'isSourceLoading']),
    sources() {
      return this.getSources
    },
    currentSource() {
      return this.getCurrentSource
    },
    sourceLoading() {
      return this.isSourceLoading
    },
    selectedSource: {
      get() {
        return this.currentSource?.source_id || null
      },
      set(value) {
        const source = this.sources.find(s => s.source_id === value)
        this.SET_CURRENT_SOURCE(source)
      }
    }
  },
  async mounted() {
    // 初始化时加载数据源
    try {
      await this.fetchSources()
      // 如果没有当前选择的源，自动选择第一个
      if (!this.currentSource && this.sources.length > 0) {
        this.SET_CURRENT_SOURCE(this.sources[0])
      }
    } catch (error) {
      ElMessage.error('加载数据源失败: ' + error.message)
    }
  },
  methods: {
    ...mapActions(['fetchSources', 'testSource']),
    ...mapMutations(['SET_CURRENT_SOURCE']),
    
    async handleSourceChange(sourceId) {
      const source = this.sources.find(s => s.source_id === sourceId)
      if (source) {
        this.SET_CURRENT_SOURCE(source)
        ElMessage.success(`已切换到数据源: ${source.wechat_id}`)
        
        // 自动测试连接
        await this.testConnection()
        
        // 触发数据刷新事件
        this.$emit('source-changed', source)
      }
    },
    
    async testConnection() {
      if (!this.currentSource) return
      
      this.testing = true
      try {
        const result = await this.testSource(this.currentSource.source_id)
        if (result.connected) {
          this.connectionStatus[this.currentSource.source_id] = 'connected'
          ElMessage.success('连接测试成功')
        } else {
          this.connectionStatus[this.currentSource.source_id] = 'disconnected'
          ElMessage.error('连接测试失败')
        }
      } catch (error) {
        this.connectionStatus[this.currentSource.source_id] = 'disconnected'
        ElMessage.error('连接测试失败: ' + error.message)
      } finally {
        this.testing = false
      }
    },
    
    async refreshSources() {
      try {
        await this.fetchSources()
        ElMessage.success('数据源列表已刷新')
      } catch (error) {
        ElMessage.error('刷新数据源失败: ' + error.message)
      }
    },
    
    getConnectionStatus(sourceId) {
      return this.connectionStatus[sourceId] || 'unknown'
    }
  }
}
</script>

<style scoped>
.source-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.source-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.source-name {
  font-weight: 500;
  color: #303133;
}

.source-id {
  font-size: 12px;
  color: #909399;
}
</style>