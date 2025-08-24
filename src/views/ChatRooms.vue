<template>
  <div class="chatrooms-page">
    <div class="card">
      <div class="card-header">
        <h3>群聊管理</h3>
        <el-button type="primary" @click="loadChatrooms">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索群聊..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div v-if="loading" class="loading">
          <el-skeleton :rows="10" animated />
        </div>
        <div v-else-if="!filteredChatrooms.length" class="empty-state">
          <el-empty description="暂无群聊数据" />
        </div>
        <div v-else>
          <el-table
            :data="paginatedChatrooms"
            stripe
            style="width: 100%"
            @row-click="handleRowClick"
          >
            <el-table-column label="群名称" width="250">
              <template #default="scope">
                {{ scope.row.Name || scope.row.name || scope.row.displayName || scope.row.talkerName || '未知' }}
              </template>
            </el-table-column>
            <el-table-column label="备注" width="200">
              <template #default="scope">
                {{ scope.row.Remark || scope.row.remark || scope.row.alias || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="昵称" width="200">
              <template #default="scope">
                {{ scope.row.NickName || scope.row.nickname || scope.row.displayName || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="群主" width="200">
              <template #default="scope">
                {{ scope.row.Owner || scope.row.owner || scope.row.ownerName || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="成员数量" width="120">
              <template #default="scope">
                {{ scope.row.UserCount || scope.row.userCount || scope.row.memberCount || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button
                  type="text"
                  @click="viewChatHistory(scope.row)"
                >
                  查看聊天记录
                </el-button>
                <el-button
                  type="text"
                  @click="copyChatroomId(scope.row)"
                >
                  复制ID
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="filteredChatrooms.length"
              layout="total, prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

export default {
  name: 'ChatRooms',
  setup() {
    const store = useStore()
    const router = useRouter()
    const loading = ref(false)
    const chatrooms = ref([])
    const searchKeyword = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)

    // 过滤后的群聊列表
    const filteredChatrooms = computed(() => {
      if (!searchKeyword.value) return chatrooms.value
      const keyword = searchKeyword.value.toLowerCase()
      return chatrooms.value.filter(chatroom => 
        (chatroom.Name || chatroom.name || chatroom.displayName || chatroom.talkerName || '').toLowerCase().includes(keyword) ||
        (chatroom.Remark || chatroom.remark || chatroom.alias || '').toLowerCase().includes(keyword) ||
        (chatroom.NickName || chatroom.nickname || chatroom.displayName || '').toLowerCase().includes(keyword) ||
        (chatroom.Owner || chatroom.owner || chatroom.ownerName || '').toLowerCase().includes(keyword)
      )
    })

    // 分页后的群聊列表
    const paginatedChatrooms = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredChatrooms.value.slice(start, end)
    })

    // 加载群聊列表
    const loadChatrooms = async () => {
      const currentSource = store.getters.getCurrentSource
      if (!currentSource) {
        ElMessage.warning('请先选择数据源')
        return
      }
      
      loading.value = true
      try {
        const response = await api.getChatrooms(currentSource.source_id)
        chatrooms.value = response.data || []
        ElMessage.success(`加载了 ${chatrooms.value.length} 个群聊`)
      } catch (error) {
        ElMessage.error('加载群聊失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 搜索处理
    const handleSearch = () => {
      currentPage.value = 1
    }

    // 分页处理
    const handlePageChange = (page) => {
      currentPage.value = page
    }

    // 行点击处理
    const handleRowClick = (row) => {
      console.log('群聊详情:', row)
    }

    // 查看聊天记录
    const viewChatHistory = (chatroom) => {
      const talker = chatroom.Name || chatroom.name || chatroom.displayName || 
                   chatroom.talkerName || chatroom.id
      router.push({
        path: '/chatlog',
        query: {
          talker: talker
        }
      })
    }

    // 复制群聊ID
    const copyChatroomId = (chatroom) => {
      const id = chatroom.id || chatroom.Name || chatroom.name || 
               chatroom.displayName || chatroom.talkerName
      if (id) {
        navigator.clipboard.writeText(id).then(() => {
          ElMessage.success('群聊ID已复制到剪贴板')
        }).catch(() => {
          ElMessage.error('复制失败')
        })
      } else {
        ElMessage.warning('无可复制的ID')
      }
    }

    onMounted(() => {
      loadChatrooms()
    })

    return {
      loading,
      chatrooms,
      searchKeyword,
      currentPage,
      pageSize,
      filteredChatrooms,
      paginatedChatrooms,
      loadChatrooms,
      handleSearch,
      handlePageChange,
      handleRowClick,
      viewChatHistory,
      copyChatroomId
    }
  }
}
</script>

<style scoped>
.chatrooms-page {
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.loading {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 50px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 