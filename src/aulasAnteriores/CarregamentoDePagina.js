import React from 'react';
import Header from './Header';
import Home from './Pages/Home';
import Produtos from './Pages/Produtos';

// const Titulo = ({cor, texto, children}) => {
//   return <h1 style={{color: cor}}>
//     {texto} {children}
//     </h1>
// }

const App = () => {
  const {pathname} = window.location;
  let Pagina;
  if(pathname === '/produtos'){
    Pagina = Produtos;
  }else{
    Pagina = Home;
  }
  return (
    <section>
      <Header/>
      <Pagina/>
    </section>
  );
};

export default App;
