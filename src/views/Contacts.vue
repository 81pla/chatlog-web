<template>
  <div class="contacts-page">
    <div class="card">
      <div class="card-header">
        <h3>联系人管理</h3>
        <el-button type="primary" @click="loadContacts">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索联系人..."
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
        <div v-else-if="!filteredContacts.length" class="empty-state">
          <el-empty description="暂无联系人数据" />
        </div>
        <div v-else>
          <el-table
            :data="paginatedContacts"
            stripe
            style="width: 100%"
            @row-click="handleRowClick"
          >
            <el-table-column label="用户名" width="200">
              <template #default="scope">
                {{ scope.row.userName || scope.row.UserName || scope.row.username || scope.row.id || '未知' }}
              </template>
            </el-table-column>
            <el-table-column label="昵称" width="200">
              <template #default="scope">
                {{ scope.row.nickName || scope.row.NickName || scope.row.nickname || scope.row.displayName || scope.row.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="备注" width="200">
              <template #default="scope">
                {{ scope.row.remark || scope.row.Remark || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="别名" width="200">
              <template #default="scope">
                {{ scope.row.alias || scope.row.Alias || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="添加时间" width="180">
              <template #default="scope">
                {{ formatAddTime(scope.row.add_time) }}
              </template>
            </el-table-column>
            <el-table-column label="添加方式" width="150">
              <template #default="scope">
                {{ formatAddType(scope.row.add_type) }}
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
                  @click="copyContactId(scope.row)"
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
              :total="filteredContacts.length"
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
  name: 'Contacts',
  setup() {
    const store = useStore()
    const router = useRouter()
    const loading = ref(false)
    const contacts = ref([])
    const total = ref(0)
    const searchKeyword = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)

    // 过滤后的联系人列表
    const filteredContacts = computed(() => {
      if (!searchKeyword.value) return contacts.value
      const keyword = searchKeyword.value.toLowerCase()
      return contacts.value.filter(contact => 
        (contact.userName || contact.UserName || contact.username || contact.id || '').toLowerCase().includes(keyword) ||
        (contact.nickName || contact.NickName || contact.nickname || contact.displayName || contact.name || '').toLowerCase().includes(keyword) ||
        (contact.remark || contact.Remark || '').toLowerCase().includes(keyword) ||
        (contact.alias || contact.Alias || '').toLowerCase().includes(keyword)
      )
    })

    // 显示的联系人列表（API已处理分页，直接使用过滤后的数据）
    const paginatedContacts = computed(() => {
      return filteredContacts.value
    })

    // 加载联系人列表
    const loadContacts = async (page = 1) => {
      const currentSource = store.getters.getCurrentSource
      if (!currentSource) {
        ElMessage.warning('请先选择数据源')
        return
      }
      
      loading.value = true
      try {
        const response = await api.getContacts(currentSource.source_id, page, pageSize.value)
        contacts.value = response.data || []
        total.value = response.total || 0
        ElMessage.success(`加载了 ${contacts.value.length} 个联系人，共 ${total.value} 个`)
      } catch (error) {
        ElMessage.error('加载联系人失败: ' + error.message)
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
      loadContacts(page)
    }

    // 行点击处理
    const handleRowClick = (row) => {
      console.log('联系人详情:', row)
    }

    // 查看聊天记录
    const viewChatHistory = (contact) => {
      const talker = contact.userName || contact.UserName || contact.username || contact.id || 
                   contact.nickName || contact.NickName || contact.nickname || contact.displayName || 
                   contact.name || contact.alias || contact.Alias
      router.push({
        path: '/chatlog',
        query: {
          talker: talker
        }
      })
    }

    // 复制联系人ID
    const copyContactId = (contact) => {
      const id = contact.userName || contact.UserName || contact.username || contact.id || 
               contact.nickName || contact.NickName || contact.nickname || contact.displayName || 
               contact.name || contact.alias || contact.Alias
      if (id) {
        navigator.clipboard.writeText(id).then(() => {
          ElMessage.success('联系人ID已复制到剪贴板')
        }).catch(() => {
          ElMessage.error('复制失败')
        })
      } else {
        ElMessage.warning('无可复制的ID')
      }
    }

    // 格式化添加时间
    const formatAddTime = (addTime) => {
      if (!addTime) return '-'
      try {
        const date = new Date(addTime)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return addTime
      }
    }

    // 格式化添加方式
    const formatAddType = (addType) => {
      if (!addType) return '-'
      const typeMap = {
        'system_accepted': '系统通过',
        'manual_add': '手动添加',
        'scan_qr': '扫码添加',
        'search_add': '搜索添加',
        'group_add': '群聊添加',
        'card_add': '名片添加',
        'phone_add': '手机号添加'
      }
      return typeMap[addType] || addType
    }

    onMounted(() => {
      loadContacts()
    })

    return {
      loading,
      contacts,
      total,
      searchKeyword,
      currentPage,
      pageSize,
      filteredContacts,
      paginatedContacts,
      loadContacts,
      handleSearch,
      handlePageChange,
      handleRowClick,
      viewChatHistory,
      copyContactId,
      formatAddTime,
      formatAddType
    }
  }
}
</script>

<style scoped>
.contacts-page {
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