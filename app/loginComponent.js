import React, { Component } from "react";
import * as firebase from "firebase";
const styles = require("./styles.js");

import Firestack from "react-native-firestack";
const firestack = new Firestack();

const MapViewComponent = require("./mapViewComponent");
const Database = require("./database.js");

import {
  View,
  Image,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  AlertIOS,
  Text,
  TouchableOpacity,
  Keyboard
} from "react-native";

class LoginComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: "",
      loading: true,
      waitingForFirebase: true
    };
  }

  componentWillMount() {
    // Check if the user is already logged in
    ref = this;
    firebase.auth().onAuthStateChanged(function(user) {
      if (ref.state.waitingForFirebase) {
        ref.setState({ waitingForFirebase: false });
        if (user) {
          let userId = user.uid;
          ref.props.navigator.push({
            component: MapViewComponent,
            passProps: {
              title: "Map",
              userId: userId
            }
          });
          ref.finishLoading();
        } else {
          ref.setState({ loading: false });
          // No user is signed in - show the login dialog
        }
      } else {
        // We don't care about this, the user manually logged in
      }
    });
    firestack.analytics.logEventWithName("pageView", {
      screen: "LoginComponent"
    });
    firestack.analytics.logEventWithName("openLoginView");
  }

  async signup(email, pass) {
    this.setState({ loading: true });
    ref = this;
    try {
      let userSession = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, pass);
      let userId = userSession.uid;
      console.log("Account created with ID: " + userId);

      let nav = this.props.navigator;
      this.askForTwitterUser(userId, function() {
        ref.finishLoading();
        nav.push({
          component: MapViewComponent,
          passProps: {
            title: "Map",
            userId: userId
          }
        });
      });
    } catch (error) {
      throw error;
    } finally {
      this.setState({ loading: false });
    }
  }

  async login(email, pass) {
    this.setState({ loading: true });
    ref = this;
    try {
      let userSession = await firebase
        .auth()
        .signInWithEmailAndPassword(email, pass);

      let userId = userSession.uid;
      console.log("Logged In for user with ID: " + userId);

      let nav = this.props.navigator;
      this.askForTwitterUser(userId, function() {
        ref.finishLoading();
        nav.push({
          component: MapViewComponent,
          passProps: {
            title: "Map",
            userId: userId
          }
        });
      });
    } catch (error) {
      throw error;
    } finally {
      this.setState({ loading: false });
    }
  }

  // This method will add a delay, call it only on success
  finishLoading() {
    setTimeout(
      function() {
        ref.setState({ loading: false });
      },
      500
    ); // enable the buttons later for a smoother animation
  }

  askForTwitterUser(userId, successCallback) {
    Database.getUser(userId, function(value) {
      // First, check if there is an existing twitter username
      if (value != null && value.twitterUsername != null) {
        successCallback();
        return;
      }

      AlertIOS.prompt(
        "Twitter username or your name",
        "The name will be shown next to your marker. Please use your Twitter username if you have one, as it will be used to fetch your profile picture.\n\nIf you don't have a Twitter account, just enter your real name",
        [
          {
            text: "OK",
            onPress: function(twitterUsername) {
              twitterUsername = twitterUsername.replace("@", "");
              Database.setUserTwitterName(userId, twitterUsername);
              successCallback();
            }
          }
        ],
        "plain-text"
      );
    });
  }

  onEmailSubmit = () => {
    this.refs.password.focus();
  };

  onPressRegister = async () => {
    try {
      await this.signup(this.state.email, this.state.password);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        // Already signed up, try to log them in
        await this.onPressLogin();
      } else {
        Alert.alert("Registration error", error.message);
      }
    }
  };

  onPressLogin = async () => {
    try {
      await this.login(this.state.email, this.state.password);
    } catch (error) {
      Alert.alert("Login error", error.message);
    }
  };

  dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  render() {
    return (
      <View style={styles.container} onPress={this.dismissKeyboard}>
        <Image
          source={require("./assets/headerImage.jpg")}
          style={styles.loginHeaderImage}
        >
          <Text style={styles.loginHeaderTitle}>
            wwdc.family
          </Text>
        </Image>
        <TouchableOpacity
          onPress={this.dismissKeyboard}
          style={styles.dismissKeyboardView}
        />
        <TextInput
          style={styles.email}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onChangeText={email => this.setState({ email })}
          onSubmitEditing={this.onEmailSubmit}
          value={this.state.email}
        />
        <TextInput
          ref="password"
          style={styles.password}
          placeholder="Password"
          secureTextEntry={true}
          returnKeyType="done"
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <View style={styles.buttonContainer}>
          <Button
            disabled={this.state.loading}
            onPress={this.onPressLogin}
            title="Login"
            style={styles.button}
            accessibilityLabel="Login"
          />
          <View style={{ marginLeft: 40 }} />
          <Button
            disabled={this.state.loading}
            onPress={this.onPressRegister}
            title="Register"
            style={styles.button}
            accessibilityLabel="Signup"
          />
        </View>
        <ActivityIndicator
          animating={this.state.loading}
          style={[styles.centering, { height: 80 }]}
          size="large"
        />
      </View>
    );
  }
}

module.exports = LoginComponent;
