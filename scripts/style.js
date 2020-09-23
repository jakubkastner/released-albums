/* SCRIPTS FOR STYLE WEBPAGE */

/**
 * Hover login button. Change background color.
 */
elLoginMenu
    .mouseover(function () {
        elLoginButton.addClass('hover');
    })
    .mouseout(function () {
        if (!elLoginMenu.hasClass('show')) {
            elLoginButton.removeClass('hover');
        }
    });

/**
 * Click to login button. Shows/hide login options.
 */
elLoginButton.click(function () {
    event.stopPropagation();
    elLoginMenu.toggleClass('show');
    elLoginButton.toggleClass('hover');
});
/**
 * Click everywhere. Hide login options.
 */
$(document).click(function () {
    elLoginMenu.removeClass('show');
    elLoginButton.removeClass('hover');
});