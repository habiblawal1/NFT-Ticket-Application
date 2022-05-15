import styles from "../../styles/Layout.module.css";
import Navbar from "./Navbar";
import LoginStatus from "../LoginStatus";

const Layout = (props) => {
  return (
    <div className={styles}>
      <Navbar />
      <LoginStatus>
        {/*Props.children will  be the entire application*/}
        {props.children}
      </LoginStatus>
    </div>
  );
};

export default Layout;
