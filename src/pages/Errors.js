import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { Container } from "react-bootstrap";
import { getLoc } from "../Translation";

export function Notfound() {
    return (
        <>
            <Header />
            <title>{getLoc("errors_404")}</title>
            <Container>
                <h2 className="mt-5">{getLoc("errors_404")}</h2>
                <br />
                <p>{getLoc("errors_404_desc")}
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
            <title>{getLoc("errors_403")}</title>
            <Container>
                <h2 className="mt-5">{getLoc("errors_403")}</h2>
                <br />
                <p>{getLoc("errors_403_desc")}
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
            <title>{getLoc("errors_401")}</title>
            <Container>
                <h2 className="mt-5">{getLoc("errors_401")}</h2>
                <br />
                <p>{getLoc("errors_401_desc")}
                </p>
            </Container>
            <Footer />
        </>
    );
}