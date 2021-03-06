import './Login.css';

import React, { useState } from 'react';
import Web3 from 'web3';

import { Auth } from '../types';

interface Props {
	onLoggedIn: (auth: Auth) => void;
}

let web3: Web3 | undefined = undefined; // Will hold the web3 instance
// eslint-disable-next-line
export const Login = ({ onLoggedIn }: Props): JSX.Element => {
	const [loading, setLoading] = useState(false); // Loading button state

	const handleAuthenticate = ({
		publicAddress,
		signature,
	}: {
		publicAddress: string;
		signature: string;
	}) =>
		fetch(`${process.env.REACT_APP_BACKEND_URL}/signin`, {
			body: JSON.stringify({ publicAddress, signature }),
			headers: {
				'Content-Type': 'application/json',
			},
			method: 'POST',
		}).then((response) => console.log(response.json()));

	const handleSignMessage = async ({
		publicAddress,
		nonce,
	}: {
		publicAddress: string;
		nonce: string;
	}) => {
		try {
			console.log(nonce);
			const signature = await web3!.eth.personal.sign(
				`nonce:${nonce}`,
				publicAddress,
				'' // MetaMask will ignore the password argument here
			);

			return { publicAddress, signature };
		} catch (err) {
			throw new Error(
				'You need to sign the message to be able to log in.'
			);
		}
	};

	const handleSignup = (publicAddress: string) =>
		fetch(`${process.env.REACT_APP_BACKEND_URL}/nonce`, {
			body: JSON.stringify({ publicAddress }),
			headers: {
				'Content-Type': 'application/json',
			},
			method: 'POST',
		}).then((response) => response.json());

	const handleClick = async () => {
		// Check if MetaMask is installed
		if (!(window as any).ethereum) {
			window.alert('Please install MetaMask first.');
			return;
		}

		if (!web3) {
			try {
				// Request account access if needed
				await (window as any).ethereum.enable();

				// We don't know window.web3 version, so we use our own instance of Web3
				// with the injected provider given by MetaMask
				web3 = new Web3((window as any).ethereum);
			} catch (error) {
				window.alert('You need to allow MetaMask.');
				return;
			}
		}

		const coinbase = await web3.eth.getCoinbase();
		if (!coinbase) {
			window.alert('Please activate MetaMask first.');
			return;
		}

		const publicAddress = coinbase.toLowerCase();
		setLoading(true);
		handleSignup(publicAddress)
			// Popup MetaMask confirmation modal to sign message
			.then(handleSignMessage)
			// Send signature to backend on the /auth route
			.then(handleAuthenticate)
			// Pass accessToken back to parent component (to save it in localStorage)
			.catch((err) => {
				window.alert(err);
				setLoading(false);
			});
	};

	return (
		<div>
			<p>
				Please select your login method.
				<br />
				For the purpose of this demo, only MetaMask login is
				implemented.
			</p>
			<button className="Login-button Login-mm" onClick={handleClick}>
				{loading ? 'Loading...' : 'Login with MetaMask'}
			</button>
			<button className="Login-button Login-fb" disabled>
				Login with Facebook
			</button>
			<button className="Login-button Login-email" disabled>
				Login with Email
			</button>
		</div>
	);
};
