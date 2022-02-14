import { FormEvent, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/Home.module.css";
import { withSSRGuest } from "../utils/withSSRGuest";

export default function Home() {
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')

  const { signIn } = useContext(AuthContext)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = {
      email,
      password,
    }
    await signIn(data)
  }
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hello world!</h1>

      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={ e => setEmail(e.target.value)} />
        <input type="password" value={password} onChange={ e => setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {},
  };
})