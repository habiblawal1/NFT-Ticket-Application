import Navbar from "./Navbar";

const Layout = (props) => {
  return (
    <>
      <Navbar />
      {/*Props.children will  be the entire application*/}
      {props.children}
    </>
  );
};

export default Layout;
