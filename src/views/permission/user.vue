<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="queryParams" :inline="true" style="margin-top:10px;">
      <el-form-item label="用户帐号" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入用户帐号"
          clearable
          size="small"
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="状态"
          clearable
          size="small"
          style="width: 240px"
        >
          <el-option key="-1" label="全部" :value="-1" />
          <el-option key="1" label="启用" :value="1" />
          <el-option key="0" label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
      </el-col>
    </el-row>

    <!-- <el-button type="primary" @click="handleAddRole">新增用户</el-button> -->
    <!-- 表格数据 -->
    <el-table v-loading="loading" :data="userList" style="width: 100%;margin-top:30px;" border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column align="center" label="用户账号" width="150" prop="nickname" />
      <!-- <el-table-column align="center" label="角色" width="150" prop="othername" /> -->
      <el-table-column label="角色" prop="role_name" :show-overflow-tooltip="true" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.roles|mergeRoles }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="密码" width="150" prop="pswd" />
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag
            :type="status ? 'success' : 'info'"
            disable-transitions
          >{{ scope.row.status ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="create_time" width="140" />
      <el-table-column label="修改时间" align="center" prop="last_login_time" width="140" />
      <el-table-column align="center" label="操作">
        <template slot-scope="scope">
          <el-button type="text" size="small" icon="el-icon-edit" @click="handleEdit(scope.row)">修改</el-button>
          <el-button type="text" size="small" icon="el-icon-edit" @click="handleEditPwd(scope.row)">修改密码</el-button>
          <el-button type="text" size="small" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 模态框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item v-if="form.action !== 'edit-pwd'" label="用户帐号" prop="user_name">
          <el-input v-model="form.user_name" placeholder="请输入帐号" />
        </el-form-item>
        <el-form-item v-if="form.action === 'edit-pwd'" label="原密码" prop="old_password">
          <el-input v-model="form.old_password" type="password" placeholder="请输入原用户密码" />
        </el-form-item>
        <el-form-item v-if="!form.user_id || form.action === 'edit-pwd'" label="用户密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入用户密码" />
        </el-form-item>
        <el-form-item v-if="!form.user_id || form.action === 'edit-pwd'" label="确认密码" prop="repassword">
          <el-input v-model="form.repassword" type="password" placeholder="请再次输入用户密码" />
        </el-form-item>
        <el-form-item v-if="form.action !== 'edit-pwd'" label="角色" prop="role_ids">
          <el-select v-model="form.role_ids" multiple placeholder="请选择角色">
            <el-option
              v-for="item in roles"
              :key="item.role_id"
              :label="item.role_name"
              :value="item.role_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.action !== 'edit-pwd'" label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :key="1" :label="1">开启</el-radio>
            <el-radio :key="0" :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// import { getRoutes, getRoles, addRole, deleteRole, updateRole } from '@/api/role'
import { listUser, delUser } from '@/api/permission/user'
import { listRole } from '@/api/permission/role'
// import { MessageBox } from 'element-ui'
// import { resetForm } from '@/utils/costum'
// import { login, getInfo, logout } from '@/api/user'
// import store from '../../../store'
export default {
  filters: {
    mergeRoles(roles) {
      const role_names = []
      roles.forEach(item => {
        role_names.push(item.role_name)
      })
      return role_names.join(' | ')
    }
  },
  data() {
    // 验证旧密码
    const validateOldPwd = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入原密码'))
      } else if (value.length < 6) {
        callback(new Error('密码长度不能小于6'))
      } else {
        callback()
      }
    }
    // 验证密码
    const validatePwd = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码'))
      } else if (value.length < 6) {
        callback(new Error('密码长度不能小于6'))
      } else {
        callback()
      }
    }
    // 二次验证密码
    const validateRePwd = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.form.password) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      queryParams: { // 查询参数
        nickname: '',
        status: -1
      },
      total: 0, // 总条数
      multiple: true, // 非多个禁用
      loading: true,
      form: {}, // 表单参数
      title: '', // 模态框弹出层标题
      open: false, // 是否显示模态框弹出层
      roles: [], // 角色
      // role: Object.assign({}, defaultRole),
      routes: [],
      userList: [],
      // 表单校验
      rules: {
        user_name: [
          { required: true, message: '帐号不能为空', trigger: 'blur' },
          { min: 3, max: 10, message: '帐号长度3-10之内', trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9]+$/, message: '帐号只能字母数字组成', trigger: 'blur' }
        ],
        role_ids: [
          { type: 'array', required: true, message: '请选择角色', trigger: 'change' }
        ],
        old_password: [{ validator: validateOldPwd, trigger: 'change' }],
        password: [{ validator: validatePwd, trigger: 'change' }],
        repassword: [{ validator: validateRePwd, trigger: 'change' }]
      }
    }
  },
  computed: {
    routesData() {
      return this.routes
    }
  },
  created() {
    this.showList()
    this.getList()
  },
  methods: {
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.user_id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    // 显示用户数据列表
    showList() {
      listUser().then(
        res => {
          this.userList = res.data
          // console.log(this.userList)
        }
      )
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.getList()
    },
    /** 查询用户列表 */
    getList() {
      this.loading = true
      if (this.queryParams.user_name === '') {
        this.queryParams.user_name = undefined
      }
      listUser(this.queryParams).then(
        res => {
          this.userList = res.data
          this.total = res.data.length
          this.loading = false
        }
      )
    },
    // 获取角色列表
    getListRole() {
      listRole().then(res => {
        this.roles = res.data
        // this.roles.forEach((item, index, arr) => {
        //   this.role_name = item.name
        //   this.role_id = item.id
        //   console.log(this.role_name, this.role_id)
        // })
        console.log(this.roles)
      })
    },
    // 重置按钮
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 表单重置
    reset() {
      if (this.$refs.menu !== undefined) {
        this.$refs.menu.setCheckedKeys([])
      }
      this.form = {
        user_id: undefined,
        user_name: undefined,
        status: 0,
        role_ids: [],
        password: undefined,
        repassword: undefined
      }
      this.resetForm('form')
    },
    /** 新增按钮操作 */
    handleAdd() {
      // this.reset()
      this.getListRole()
      this.open = true
      this.title = '添加用户'
    },
    /** 修改按钮操作 */
    handleEdit(row) {
      // this.reset()
      this.getListRole()
      this.form = {
        user_id: row.user_id,
        user_name: row.user_name,
        status: row.status
      }
      console.log(row.roles)
      const role_ids = row.roles.map(item => {
        return item.role_id
      })
      this.$set(this.form, 'role_ids', role_ids)
      this.open = true
      this.title = '修改用户信息'
    },
    /** 修改密码按钮操作 */
    handleEditPwd(row) {
      this.reset()
      this.form = {
        user_id: row.user_id,
        action: 'edit-pwd'
      }
      this.open = true
      this.title = '修改密码'
    },
    // reLogin() {
    //   MessageBox.confirm('修改成功，请重新登录', '重新登录', {
    //     confirmButtonText: '重新登录',
    //     cancelButtonText: '取消',
    //     type: 'warning'
    //   }).finally(() => {
    //     store.dispatch('user/resetToken').then(() => {
    //       location.reload()
    //     })
    //   })
    // },
    /** 删除按钮操作 */
    handleDelete(row) {
      // 判断是单个删除还是多选删除
      const user_ids = row.user_id ? [row.user_id] : this.ids
      this.$confirm('是否确认删除用户编号为"' + user_ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delUser(user_ids)
      }).then(() => {
        this.getList()
        this.msgSuccess('删除成功')
      }).catch(function() {})
    },
    // 模态框中的确定按钮
    submitForm() {
    // 添加用户
    // getListRole() {
    //   addUser().then(res => {
    //     this.roles = res.data.roles
    //     console.log(this.roles)
    //   })
    // },
    },
    // 模态框中的取消按钮
    cancel() {

    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  .roles-table {
    margin-top: 30px;
  }
  .permission-tree {
    margin-bottom: 30px;
  }
}
</style>
