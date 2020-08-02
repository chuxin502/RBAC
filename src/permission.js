import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken() // 判断用户是否登录，获取token

  let flag = 0

  if (hasToken) {
    if (to.path === '/login') { // 有token且路由为login
      // if is logged in, redirect to the home page
      next({ path: '/' }) // 到首页
      NProgress.done() // hack: https://github.com/PanJiaChen/vue-element-admin/pull/2939
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) { // 本地储存有用户名
        next()
      } else { // 首次登录的情况下
        try {
          if (flag === 0) {
            // get user info
            // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
            const { roles } = await store.dispatch('user/getInfo')

            // generate accessible routes map based on roles
            // 动态生成路由
            const accessRoutes = await store.dispatch('permission/generateRoutes', roles)

            // dynamically add accessible routes
            // 动态添加路由
            router.addRoutes(accessRoutes)
            router.options.routes = store.state.permission.routes // 渲染侧导航
            flag++

            // hack method to ensure that addRoutes is complete
            // set the replace: true, so the navigation will not leave a history record
            next({ ...to, replace: true })
          } else { // 解决页面刷新问题
            next()
          }
        } catch (error) { // 重新登录
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else { // 没有token返回登录页，重新登录
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
