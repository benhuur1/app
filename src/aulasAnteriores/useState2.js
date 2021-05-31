import React from 'react';

const App = () => {
  const [contar, setContar] = React.useState(1);
  const [items, setItems] = React.useState(['Item 1']);

  function handleClick() {
    setContar(contar + 1);
    setItems([...items, 'Item ' + (contar + 1)]);
  }

  return (
    <div>
      <button onClick={handleClick}>{contar}</button>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </div>
  );
};

export default App;
