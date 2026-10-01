const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const userModel = require('../models/userModel');

module.exports = (db) => {
    const users = userModel(db);

    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // console.log('GITHUB PROFILE:', profile);

                    const githubId = String(profile.id);

                    // console.log('GITHUB ID:', githubId);

                    const response = await fetch(
                        'https://api.github.com/user/emails',
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                Accept: 'application/vnd.github+json',
                                'User-Agent': 'your-app',
                            },
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `GitHub email API returned ${response.status}`
                        );
                    }

                    const emails = await response.json();

                    // console.log('GITHUB EMAILS:', emails);

                    const primaryEmail =
                        emails.find(
                            (email) =>
                                email.primary && email.verified
                        ) ||
                        emails.find(
                            (email) => email.verified
                        );

                    const email = primaryEmail?.email;

                    // console.log('GITHUB EMAIL:', email);

                    if (!email) {
                        return done(null, false, {
                            message: 'github_no_email',
                        });
                    }

                    const name =
                        profile.displayName ||
                        profile.username;

                    const picture =
                        profile.photos?.[0]?.value;

                    const user = await users.findByGithubId(githubId);

                    // console.log('LOCAL USER:', user);

                    let userId;

                    if (user) {
                        userId = user.id;

                        await users.updateGithubProfile(
                            githubId,
                            name,
                            picture
                        );
                    } else {
                        userId = await users.createGithub(
                            githubId,
                            email,
                            name,
                            picture
                        );
                    }

                    // console.log('LOCAL USER ID:', userId);

                    return done(null, {
                        id: userId,
                    });
                } catch (err) {
                    console.error(
                        'PASSPORT GITHUB ERROR:',
                        err
                    );

                    return done(err);
                }
            }
        )
    );

    return passport;
};