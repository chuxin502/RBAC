import request from '@/utils/request'

export function listUser(data) {
  return request({
    url: '/user-provider/user/list',
    method: 'get',
    data
  })
}

export function addUser(data) {
  return request({
    url: '/user-provider/user/add',
    method: 'post',
    data
  })
}

export function delUser(data) {
  return request({
    url: '/user-provider/user/remove',
    method: 'post',
    data
  })
}

export function updateUser(user_id, data) {
  return request({
    url: '/user-provider/user/edit?user_id=' + user_id,
    method: 'post',
    data
  })
}

