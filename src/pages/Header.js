import { Link } from "react-router-dom";
import logo from "../images/logo.png"
import Button from "react-bootstrap/Button"
import Navbar from "react-bootstrap/Navbar"
import Nav from "react-bootstrap/Nav"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { getLoc } from "../Translation";

function Header() {
	const [input, setInput] = useState("");
	const { user, gotUser } = useContext(AuthContext);

	async function Logout() {
		await fetch("/api/logout",
		{
			method: "POST",
			headers: {
				'Content-Type': 'application/json; charset=UTF-8',
			},
		})
		window.location.href = "/";
	}

	return (
		<>
			<header className="py-3 border-bottom">
				<Container className="d-flex flex-wrap justify-content-center">
					<a className="d-flex align-items-center mb-3 mb-lg-0 me-lg-auto link-body-emphasis text-decoration-none">
						<img width={250} height={100} src={logo} alt="logo"/>
					</a>
					<div className="d-flex align-items-center">
					</div>
				</Container>
			</header>
			<Navbar className="py-2 bg-body-tertiary border-bottom">
				<Container className="d-flex flex-wrap">
					<Nav className="me-auto">
						<Nav.Item>
							<Link to="/" className="nav-link link-body-emphasis px-2 active" aria-current="page">{getLoc("header_homepage")}</Link>
						</Nav.Item>
						<Nav.Item>
							<Link to="/projects" className="nav-link link-body-emphasis px-2">{getLoc("header_my_projects")}</Link>
						</Nav.Item>
						<Nav.Item>
							<Link to="/search" className="nav-link link-body-emphasis px-2">{getLoc("header_search")}</Link>
						</Nav.Item>
					</Nav>
					{user 
				? 
					<Nav className="d-flex">
						<Nav.Item>
							<Link to={"/users/" + user.id} reloadDocument className="nav-link link-primary px-2">
								{user.username}
							</Link>
						</Nav.Item>
						<Button
							className="nav-item border-0 p-1 px-2 ms-2 m-auto"
							variant="outline-secondary"
							style={{ height: "75%"}}
							onClick={Logout}>
							{getLoc("header_logout")}
						</Button>

					</Nav> 
				: gotUser &&
					<Nav style={{ display: "flex" }}>
						<Nav.Item>
							<Link to="/login" className="nav-link link-body-emphasis px-2">
								{getLoc("header_signin")}
							</Link>
						</Nav.Item>
						<Nav.Item>
							<Link to="/signup" className="nav-link link-body-emphasis px-2">
								{getLoc("header_signup")}
							</Link>
						</Nav.Item>
					</Nav>
				}
				</Container>
			</Navbar>
		</>
	);
}

export default Header;