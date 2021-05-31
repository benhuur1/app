import React from 'react'

const Produto1 = ({dados}) => {
  return (
    <div>
      <h1>{dados.nome}</h1>
      <p>{dados.preco}</p>
      <img src={dados.fotos[0].src} alt={dados.fotos[0].titulo} width="300"/>
    </div>
  )
}

export default Produto1
