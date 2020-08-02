import request from '@/utils/request'

export function listRole(params) {
  return request({
    url: '/role-provider/role/list',
    method: 'post',
    params
  })
}

export function getRole(params) {
  return request({
    url: '/role-provider/role/select',
    method: 'post',
    params
  })
}

export function addRole(data) {
  return request({
    url: '/role-provider/role/add',
    method: 'post',
    data
  })
}

export function delRole(data) {
  return request({
    url: '/role-provider/role/remove',
    method: 'post',
    data
  })
}

export function updateRole(role_id, data) {
  return request({
    url: '/role-provider/role/edit?role_id=' + role_id,
    method: 'post',
    data
  })
}
