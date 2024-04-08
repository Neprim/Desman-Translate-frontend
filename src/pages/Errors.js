import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { Container } from "react-bootstrap";

export function Notfound() {
    return (
        <>
            <Header />
            <Container>
                <h2 className="mt-5">404 Not Found</h2>
                <br />
                <p>Такой страницы не существует. 
                    {/* Проверьте адрес страницы или <Link to="/create" className="link-primary">создайте свой проект с такой ссылкой!</Link> */}
                    </p>
            </Container>
            <Footer />
        </>
    );
}
export function Forbidden() {
    return (
        <>
            <Header />
            <Container>
                <h2 className="mt-5">403 Forbidden</h2>
                <br />
                <p>Доступ к этой странице запрещён.
                </p>
            </Container>
            <Footer />
        </>
    );
}
export function Unathorized() {
    return (
        <>
            <Header />
            <Container>
                <h2 className="mt-5">401 Unathorized</h2>
                <br />
                <p>Доступ к этой странице без авторизации невозможен.
                </p>
            </Container>
            <Footer />
        </>
    );
}