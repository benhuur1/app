import React from 'react'

const ButtonModal = ({setModal}) => {
  function handleClick(){
    setModal((ativo) => !ativo);
  }
  return (
<div>
<button onClick={handleClick}>Abrir</button> 
</div>
  )
}

export default ButtonModal
