import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container';
import { getLoc } from '../Translation';

function Footer() {
    return (
        <Navbar className="bg-body-tertiary mt-4 py-2 border-top">
            <Container className="d-flex flex-wrap">
                <Nav className="me-auto">
                    <Nav.Link className="px-2"
                    href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
                        {getLoc("footer_help")}
                    </Nav.Link>
                </Nav>
                <Nav className="align-items-center">
                    <Nav.Link className="px-2"
                    href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
                        {getLoc("footer_credits")}
                    </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default Footer;