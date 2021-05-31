import React from 'react'
import Button from './Button'
import Input from './Input'

const Form = () => {
  const arr = ['Item 1', 'Item 2']; 
  return (
<form>
      <Input id="email" label="E-mail" required placeholder="senha"/> 
      <Input id="senha" type="password" label="Senha"/> <br />
      <label className="checkbox">
        <input type="checkbox"/>
        Remember me
      </label>
      <Button items={arr}/>
    </form>
  )
}

export default Form
