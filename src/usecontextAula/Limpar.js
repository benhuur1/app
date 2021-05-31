import React from 'react';
import { GlobalContext } from './GlobalContext';

const Limpar = () => {
  const { limparDados } = React.useContext(GlobalContext);
  console.log(limparDados);
  return <button onClick={limparDados}>Limpar</button>;
};

export default Limpar;
