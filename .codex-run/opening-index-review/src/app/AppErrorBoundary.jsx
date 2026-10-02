import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App render failed", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="app-error-boundary" role="alert">
        <h1>页面遇到问题</h1>
        <p>当前会话已保留，请刷新页面或返回首页后重试。</p>
        <button type="button" onClick={() => window.location.reload()}>
          刷新页面
        </button>
      </main>
    );
  }
}
