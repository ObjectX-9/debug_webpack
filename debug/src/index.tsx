import React from 'react';
import ReactDOM from 'react-dom';
import './styles/mian.less';
import logo from './assets/images/logo.png';

const App: React.FC = () => {
  return (
    <div className="app">
      <h1>Hello, Webpack!</h1>
      <img src={logo} alt="Logo" />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
