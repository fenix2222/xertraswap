/* eslint-disable import/prefer-default-export */
// Shim for react-dom/client (React 18 API) to work with React 17
// Web3Auth v8 UI requires createRoot, but we're on React 17
import ReactDOM from 'react-dom'

export function createRoot(container) {
  return {
    render(element) {
      ReactDOM.render(element, container)
    },
    unmount() {
      ReactDOM.unmountComponentAtNode(container)
    },
  }
}
