exports.errorRedirect = (url, message) => {
    return url + '?message=' + message;
}

exports.profileUpdateErrorRedirect = () =>
    this.errorRedirect('/profile', 'An unexpected error occurred updating your profile');

