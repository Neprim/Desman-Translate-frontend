import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container';

function Footer() {
    return (
        <Navbar className="bg-body-tertiary py-2 border-top" style={{ marginTop: 20 }}>
            <Container className="d-flex flex-wrap">
                <Nav className="me-auto">
                    <Nav.Link className="px-2"
                    href="mailto:zimenkova@petrsu.ru">
                        Поддержка
                    </Nav.Link>
                </Nav>
                <Nav className="align-items-center">
                    <Nav.Link className="px-2"
                    href="https://cs.petrsu.ru">
                        © ПетрГУ 2023
                    </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default Footer;