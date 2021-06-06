import React from 'react';

const App = () => {
  const [produto, setProduto] = React.useState('');

  function handleChange({ target }) {
    setProduto(target.value);
  }

  return (
    <form>
      {produto}
      <label>
        <input
          type="radio"
          onChange={handleChange}
          checked={produto === 'smartphone'}
          value="smartphone"
        />
        Smartphone
      </label>
      <label>
        <input
          type="radio"
          onChange={handleChange}
          checked={produto === 'notebook'}
          value="notebook"
        />
        Notebook
      </label>
    </form>
  );
};

export default App;
