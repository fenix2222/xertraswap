var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React from "react";
import Flex from "../../../components/Box/Flex";
import Link from "../../../components/Link/Link";
import * as IconModule from "../icons";
import { socials } from "../config";
var Icons = IconModule;
var SocialLinks = function () { return (React.createElement(Flex, { alignItems: "center" }, socials.map(function (social, index) {
    var Icon = Icons[social.icon];
    var iconProps = { width: "24px", height: "24px", color: "textSubtle", style: { cursor: "pointer" } };
    var mr = index < socials.length - 1 ? "24px" : 0;
    return (React.createElement(Link, { external: true, key: social.label, href: social.href, "aria-label": social.label, mr: mr },
        React.createElement(Icon, __assign({}, iconProps))));
}))); };
export default React.memo(SocialLinks, function () { return true; });
