import { Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 未登录提示弹框组件
 * @param {Function} navigate - 导航函数
 * @param {string} currentPath - 当前路径（可选，用于登录后返回）
 */
export const showLoginModal = (navigate, currentPath) => {
  Modal.confirm({
    title: '未登录提示',
    content: '您还未登录，是否跳转到登录页面？',
    okText: '去登录',
    cancelText: '取消',
    onOk: () => {
      // 保存当前路径，登录后返回
      navigate('/login', { 
        state: { from: { pathname: currentPath || window.location.pathname } } 
      });
    },
  });
};

export default showLoginModal;

