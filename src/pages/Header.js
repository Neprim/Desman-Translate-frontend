import { Link } from "react-router-dom";
import logo from "../images/logo.png"
import Button from "react-bootstrap/Button"
import Navbar from "react-bootstrap/Navbar"
import Nav from "react-bootstrap/Nav"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext";

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
		window.location.reload(false);
	}

	return (
		<>
			<header className="py-3 border-bottom">
				<Container className="d-flex flex-wrap justify-content-center">
					<a className="d-flex align-items-center mb-3 mb-lg-0 me-lg-auto link-body-emphasis text-decoration-none">
						<img
							width={250}
							height={100}
							src={logo}
							alt="logo"
						/>
					</a>
					<div className="d-flex align-items-center">
						<Form role="search">
							<Form.Control
								type="search"
								className="form-control"
								placeholder="Поиск..."
								aria-label="Search"
							/>
						</Form>
					</div>
				</Container>
			</header>
			<Navbar className="py-2 bg-body-tertiary border-bottom">
				<Container className="d-flex flex-wrap">
					<Nav className="me-auto">
						<Nav.Item>
							<Link
								to="/"
								className="nav-link link-body-emphasis px-2 active"
								aria-current="page"
							>
								Главная
							</Link>
						</Nav.Item>
						<Nav.Item>
							<Link to="/projects" className="nav-link link-body-emphasis px-2">
								Проекты
							</Link>
						</Nav.Item>
						<Nav.Item>
							<Link to="/search" className="nav-link link-body-emphasis px-2">
								Поиск проектов
							</Link>
						</Nav.Item>
					</Nav>
					{user 
				? 
					<Nav style={{ display: "flex" }}>
						<Nav.Item>
							<Link to={"/users/" + user.id} reloadDocument className="nav-link link-primary px-2">
								{user.username}
							</Link>
						</Nav.Item>
						<Button
							className="nav-item border-0"
							variant="outline-secondary"
							style={{ padding: "2px", height: "75%", margin: "auto", marginLeft: "10px" }}
							onClick={Logout}>
							Выйти
						</Button>

					</Nav> 
				: gotUser &&
					<Nav style={{ display: "flex" }}>
						<Nav.Item>
							<Link to="/login" className="nav-link link-body-emphasis px-2">
								Войти
							</Link>
						</Nav.Item>
						<Nav.Item>
							<Link to="/signup" className="nav-link link-body-emphasis px-2">
								Зарегистрироваться
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