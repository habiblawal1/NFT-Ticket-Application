import styles from "../../styles/Layout.module.css";
import Navbar from "./Navbar";

const Layout = (props) => {
  return (
    <div className={styles}>
      <Navbar />
      {/*Props.children will  be the entire application*/}
      {props.children}
    </div>
  );
};

export default Layout;
