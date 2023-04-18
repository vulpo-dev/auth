import { createTranslations, Document } from "postler";
import { props } from "./types";
import { Translation } from "./translations";
import { Button } from "../../component/button";
import { Typography } from "@vulpo-dev/brief";
import { Body, Container, Link, Text, Title } from "../../component";

let t = createTranslations<Translation>();

export let Plaintext = () => {
	return <>{t.headline}: {t.text}</>
}

export let Template = () => {
	return (
		<Document>
			<Typography />
			<Body>
				<Container>
					<Title>{t.headline}</Title>
					<Text>{t.text}</Text>

					<Button align="center" primary href={props.href}>
						{t.label}
					</Button>

					<Link href={props.href} />					
				</Container>
			</Body>
		</Document>
	);
};
